import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../src';
import accountService from '../src/service/account-service';
import attService from '../src/service/att-service';
import emailService from '../src/service/email-service';

describe('分享邮件中的链接', () => {
	beforeEach(() => {
		vi.spyOn(accountService, 'selectById').mockResolvedValue({ accountId: 1, userId: 2 });
		vi.spyOn(emailService, 'list').mockResolvedValue({ list: [{ emailId: 3 }] });
		vi.spyOn(attService, 'selectByEmailIds').mockResolvedValue([]);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	async function getSharedHtml(content, type) {
		vi.spyOn(emailService, 'selectById').mockResolvedValue({ emailId: 3, userId: 2, content });
		const shareData = {
			type,
			accountId: 1,
			emailId: 3,
			userId: 2,
			email: 'inbox@example.com',
			expiresAt: Date.now() + 60000,
		};
		const env = {
			kv: { get: vi.fn().mockResolvedValue(JSON.stringify(shareData)) },
		};
		const ctx = createExecutionContext();
		const response = await worker.fetch(new Request('https://mail.example.com/api/share/test'), env, ctx);
		await waitOnExecutionContext(ctx);
		const result = await response.json();
		expect(result.code).toBe(200);
		return type === 'email' ? result.data.messages[0].html : result.data.email.html;
	}

	it.each(['email', 'message'])('%s 分享的登录链接在新标签页打开并保留完整地址', async type => {
		const targets = ['', '_self', '_parent', '_top', '_blank', 'mail-window'];
		const href = 'https://example.com/magic-link?token=test%2Btoken&source=email#test-fragment';
		const escapedHref = href.replace(/&/g, '&amp;');
		const content = targets.map(target => {
			const targetAttribute = target ? `target="${target}"` : '';
			return `<a href="${escapedHref}" ${targetAttribute} rel="opener">Sign in</a>`;
		}).join('');
		const html = await getSharedHtml(content, type);
		const { document } = parseHTML(html);
		const links = [...document.querySelectorAll('a[href]')];

		expect(links).toHaveLength(targets.length);
		for (const link of links) {
			expect(link.getAttribute('href')).toBe(href);
			expect(link.getAttribute('target')).toBe('_blank');
			expect(link.getAttribute('rel')).toBe('noopener noreferrer');
		}
	});

	it.each(['email', 'message'])('%s 分享的图片区域和 SVG 链接统一安全地在新标签页打开', async type => {
		const href = 'https://example.com/sign-in?token=test%2Btoken&source=image#test-fragment';
		const escapedHref = href.replace(/&/g, '&amp;');
		const targets = ['', '_self', '_parent', '_top', '_blank', 'mail-window'];
		const content = targets.map(target => {
			const targetAttribute = target ? `target="${target}"` : '';
			return `
				<img src="https://example.com/button.png" usemap="#login-${target}">
				<map name="login-${target}">
					<area href="${escapedHref}" ${targetAttribute} rel="opener" shape="rect" coords="0,0,100,50">
				</map>
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
					<a href="${escapedHref}" ${targetAttribute} rel="opener"><text>Sign in</text></a>
					<a xlink:href="${escapedHref}" ${targetAttribute} rel="opener"><text>Sign in</text></a>
				</svg>
			`;
		}).join('');
		const html = await getSharedHtml(content, type);
		const { document } = parseHTML(html);
		const links = [...document.querySelectorAll('a, area')];

		expect(links).toHaveLength(targets.length * 3);
		for (const link of links) {
			expect(link.getAttribute('href') || link.getAttribute('xlink:href')).toBe(href);
			expect(link.getAttribute('target')).toBe('_blank');
			expect(link.getAttribute('rel')).toBe('noopener noreferrer');
		}
	});

	it.each(['email', 'message'])('%s 分享清理脚本、事件和危险链接', async type => {
		const html = await getSharedHtml(`
			<script>alert('unsafe')</script>
			<iframe src="https://example.com"></iframe>
			<a href="javascript:alert('unsafe')" onclick="alert('unsafe')">危险链接</a>
			<a href="data:text/html,unsafe">危险页面</a>
			<map name="unsafe">
				<area href="javascript:alert('unsafe')" onclick="alert('unsafe')">
				<area href="data:text/html,unsafe">
			</map>
			<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				<a xlink:href="javascript:alert('unsafe')"><text>危险链接</text></a>
				<a xlink:href="data:text/html,unsafe"><text>危险页面</text></a>
			</svg>
			<a href="https://example.com/sign-in" onclick="alert('unsafe')">Sign in</a>
		`, type);
		const { document } = parseHTML(html);

		expect(document.querySelector('script, iframe, [onclick]')).toBeNull();
		expect(document.querySelectorAll('a[href], area[href]')).toHaveLength(1);
		const svgLinks = [...document.querySelectorAll('svg a')];
		expect(svgLinks).toHaveLength(2);
		for (const link of svgLinks) {
			expect(link.hasAttribute('xlink:href')).toBe(false);
		}
		expect(document.querySelector('a[href]').getAttribute('target')).toBe('_blank');
	});
});
