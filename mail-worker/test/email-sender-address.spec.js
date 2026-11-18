import { createExecutionContext, env, fetchMock, waitOnExecutionContext } from 'cloudflare:test';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../src';
import accountService from '../src/service/account-service';
import apiKeyService from '../src/service/api-key-service';
import attService from '../src/service/att-service';
import emailService from '../src/service/email-service';
import permService from '../src/service/perm-service';
import roleService from '../src/service/role-service';
import settingService from '../src/service/setting-service';
import userService from '../src/service/user-service';
import KvConst from '../src/const/kv-const';

describe('发件地址一致性', () => {
	let settings;
	let senderAccount;
	let outgoingEmail;
	const currentUser = { userId: 1, email: 'owner@example.com', type: 1, sendCount: 0 };

	beforeAll(async () => {
		fetchMock.activate();
		fetchMock.disableNetConnect();
		await env.db.prepare(`CREATE TABLE email (
			email_id INTEGER PRIMARY KEY AUTOINCREMENT,
			send_email TEXT,
			name TEXT,
			account_id INTEGER NOT NULL,
			user_id INTEGER NOT NULL,
			subject TEXT,
			text TEXT,
			content TEXT,
			cc TEXT DEFAULT '[]',
			bcc TEXT DEFAULT '[]',
			recipient TEXT,
			to_email TEXT NOT NULL DEFAULT '',
			to_name TEXT NOT NULL DEFAULT '',
			in_reply_to TEXT DEFAULT '',
			relation TEXT DEFAULT '',
			message_id TEXT DEFAULT '',
			type INTEGER NOT NULL DEFAULT 0,
			status INTEGER NOT NULL DEFAULT 0,
			resend_email_id TEXT,
			message TEXT,
			unread INTEGER NOT NULL DEFAULT 0,
			create_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
			is_del INTEGER NOT NULL DEFAULT 0
		)`).run();
	});

	beforeEach(() => {
		settings = {
			send: 0,
			resendTokens: { 'example.com': 're_parent' },
			domainList: ['@example.com'],
			r2Domain: '',
		};
		senderAccount = { accountId: 1, userId: 1, email: 'a@sub.example.com' };
		outgoingEmail = null;
		vi.spyOn(apiKeyService, 'auth').mockResolvedValue({ user: currentUser });
		vi.spyOn(permService, 'userPermKeys').mockResolvedValue(['email:send']);
		vi.spyOn(settingService, 'query').mockImplementation(async () => settings);
		vi.spyOn(userService, 'selectById').mockResolvedValue(currentUser);
		vi.spyOn(roleService, 'selectById').mockResolvedValue({
			sendType: 'count',
			sendCount: 0,
			availDomain: 'example.com',
		});
		vi.spyOn(accountService, 'selectById').mockImplementation(async () => senderAccount);
		vi.spyOn(attService, 'selectByEmailIds').mockResolvedValue([]);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		fetchMock.assertNoPendingInterceptors();
	});

	afterAll(() => {
		fetchMock.deactivate();
	});

	function mockResend(token, status = 200, data = { id: 'resend-email-id' }) {
		fetchMock.get('https://api.resend.com').intercept({
			path: '/emails',
			method: 'POST',
			headers: { authorization: `Bearer ${token}` },
		}).reply(status, request => {
			outgoingEmail = JSON.parse(request.body);
			return data;
		});
	}

	async function sendEmail(overrides = {}) {
		const request = new Request('https://mail.example.com/api/email/send', {
			method: 'POST',
			headers: { Authorization: 'cm_test', 'Content-Type': 'application/json', 'Accept-Language': 'zh' },
			body: JSON.stringify({
				accountId: 1,
				name: '测试用户',
				sendType: 'send',
				receiveEmail: ['friend@recipient.net'],
				subject: '测试邮件',
				text: '测试正文',
				content: '<p>测试正文</p>',
				attachments: [],
				...overrides,
			}),
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		return response.json();
	}

	it.each([
		{
			description: '父域名邮箱使用自身配置',
			senderEmail: 'a@example.com',
			resendTokens: { 'example.com': 're_parent' },
			token: 're_parent',
		},
		{
			description: '子域名邮箱优先使用自身配置',
			senderEmail: 'a@sub.example.com',
			resendTokens: { 'sub.example.com': 're_sub', 'example.com': 're_parent' },
			token: 're_sub',
		},
		{
			description: '子域名邮箱复用父域名配置',
			senderEmail: 'a@sub.example.com',
			resendTokens: { 'example.com': 're_parent' },
			token: 're_parent',
		},
		{
			description: '多级子域名邮箱复用祖先配置',
			senderEmail: 'a@deep.sub.example.com',
			resendTokens: { 'example.com': 're_parent' },
			token: 're_parent',
		},
		{
			description: '多级子域名邮箱优先使用最近父域名配置',
			senderEmail: 'a@deep.sub.example.com',
			resendTokens: { 'sub.example.com': 're_sub', 'example.com': 're_parent' },
			token: 're_sub',
		},
	])('$description时保留完整发件地址', async ({ senderEmail, resendTokens, token }) => {
		senderAccount.email = senderEmail;
		settings.resendTokens = resendTokens;
		mockResend(token);

		const result = await sendEmail();

		expect(result.code).toBe(200);
		expect(outgoingEmail.from).toBe(`测试用户 <${senderEmail}>`);
		expect(outgoingEmail.reply_to ?? senderEmail).toBe(senderEmail);
		expect(result.data[0].sendEmail).toBe(senderEmail);
		const stored = await env.db.prepare('SELECT send_email FROM email').first();
		expect(stored.send_email).toBe(senderEmail);
	});

	it('回复邮件保留子域名地址和原邮件关联信息', async () => {
		const original = await env.db.prepare(`INSERT INTO email
			(account_id, user_id, send_email, message_id)
			VALUES (1, 1, 'friend@recipient.net', '<original@recipient.net>') RETURNING email_id`).first();
		mockResend('re_parent');

		const result = await sendEmail({ sendType: 'reply', emailId: original.email_id, subject: 'Re: 测试邮件' });

		expect(result.code).toBe(200);
		expect(outgoingEmail.from).toBe('测试用户 <a@sub.example.com>');
		expect(outgoingEmail.headers).toEqual({
			'in-reply-to': '<original@recipient.net>',
			references: '<original@recipient.net>',
		});
		expect(result.data[0].sendEmail).toBe('a@sub.example.com');
		expect(result.data[0].inReplyTo).toBe('<original@recipient.net>');
	});

	it('转发邮件保留子域名发件地址', async () => {
		mockResend('re_parent');

		const result = await sendEmail({ sendType: 'forward', subject: 'Fwd: 测试邮件' });

		expect(result.code).toBe(200);
		expect(outgoingEmail.from).toBe('测试用户 <a@sub.example.com>');
		expect(result.data[0].sendEmail).toBe('a@sub.example.com');
	});

	it('域名验证失败时返回原因并保持发送记录和统计一致', async () => {
		const message = 'The sub.example.com domain is not verified.';
		mockResend('re_parent', 403, { name: 'validation_error', message, statusCode: 403 });

		const result = await sendEmail();

		expect(outgoingEmail.from).toBe('测试用户 <a@sub.example.com>');
		expect(result.code).toBe(501);
		expect(result.message).toBe(message);
		const stored = await env.db.prepare('SELECT COUNT(*) AS total FROM email').first();
		expect(stored.total).toBe(0);
		const counters = await env.kv.list({ prefix: KvConst.SEND_DAY_COUNT });
		expect(counters.keys).toEqual([]);
	});

	it('缺少发件凭证时向站外发送返回配置错误', async () => {
		settings.resendTokens = {};

		const result = await sendEmail();

		expect(result.code).toBe(501);
		expect(result.message).toBe('Resend未配置，只能给站内邮箱发件');
		expect(outgoingEmail).toBeNull();
	});

	it('站内邮件使用原邮箱地址投递', async () => {
		settings.resendTokens = {};
		const deliver = vi.spyOn(emailService, 'HandleOnSiteEmail').mockResolvedValue();

		const result = await sendEmail({ receiveEmail: ['friend@example.com'] });

		expect(result.code).toBe(200);
		expect(result.data[0].sendEmail).toBe('a@sub.example.com');
		expect(deliver).toHaveBeenCalledWith(
			expect.anything(),
			['friend@example.com'],
			expect.objectContaining({ sendEmail: 'a@sub.example.com' }),
			[],
		);
		expect(outgoingEmail).toBeNull();
	});
});
