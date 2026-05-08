/**
 * 分享服务 - 使用 KV 存储分享链接
 */
import accountService from './account-service';
import emailService from './email-service';
import attService from './att-service';
import { parseHTML } from 'linkedom';

const SHARE_PREFIX = 'share:';
const EMAIL_SHARE_INDEX_PREFIX = 'share-email:';

/**
 * 生成随机 ID
 */
function generateShareId(length = 12) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	const randomValues = new Uint8Array(length);
	crypto.getRandomValues(randomValues);
	for (let i = 0; i < length; i++) {
		result += chars[randomValues[i] % chars.length];
	}
	return result;
}

function htmlToText(html) {
	if (!html) return '';
	const { document } = parseHTML(html);
	document.querySelectorAll('script, style, noscript').forEach(node => node.remove());
	return document.body?.textContent?.replace(/\s+/g, ' ').trim() || '';
}

function sanitizeHtml(html) {
	if (!html) return '';
	const { document } = parseHTML(html);
	document.querySelectorAll('script, iframe, object, embed, form, input, button, textarea, select, meta, link').forEach(node => node.remove());
	document.querySelectorAll('*').forEach(node => {
		for (const attr of [...node.attributes]) {
			const name = attr.name.toLowerCase();
			const value = String(attr.value || '').trim().toLowerCase();
			if (name.startsWith('on') || value.startsWith('javascript:') || value.startsWith('data:text/html')) {
				node.removeAttribute(attr.name);
			}
		}
	});
	return rewriteSharedHtml(document.toString());
}

function shareText(emailRow) {
	const text = emailRow.text || htmlToText(emailRow.content) || '';
	return rewriteSharedText(text);
}

function shareHtml(emailRow) {
	return sanitizeHtml(emailRow.content || '');
}

function isChatGptPlusSubscription(content) {
	return content.includes('你已成功订阅 ChatGPT Plus。');
}

function rewriteSharedText(text) {
	if (!isChatGptPlusSubscription(text)) return text;

	let result = text;
	result = result.replace(/ChatGPT Plus Subscription\s+\S+/g, 'ChatGPT Plus Subscription 你买不起');
	result = result.replace(/税额：\s*\S+\s*/g, '');
	result = result.replace(/折扣：\s*\S+\s*/g, '');
	result = result.replace(/总计：\s*\S+\s*/g, '');
	result = result.replace(/付款方式\s+\S+/g, '付款方式 QQ:89045349 TG:@maguabuhuimofa');
	return result.replace(/\s{2,}/g, ' ').trim();
}

function rewriteSharedHtml(html) {
	if (!isChatGptPlusSubscription(htmlToText(html))) return html;

	const { document } = parseHTML(html);
	const nodes = [...document.querySelectorAll('td, div, p, span')];

	nodes.forEach(node => {
		const text = node.textContent?.replace(/\s+/g, ' ').trim() || '';
		if (/^(税额|折扣|总计)：/.test(text)) {
			closestRow(node).remove();
		}
	});

	[...document.querySelectorAll('td, div, p, span')].forEach(node => {
		const text = node.textContent?.replace(/\s+/g, ' ').trim() || '';
		if (/^Rp[\d.,-]+$/.test(text)) {
			node.textContent = '你买不起';
		}
		if (text === 'GoPay') {
			node.innerHTML = 'QQ:89045349&nbsp;&nbsp;TG:@maguabuhuimofa';
			node.setAttribute('style', `${node.getAttribute('style') || ''}; white-space: nowrap;`);
		}
	});

	return document.toString();
}

function closestRow(node) {
	let current = node;
	while (current?.parentElement && current.tagName !== 'TR') {
		current = current.parentElement;
	}
	return current || node;
}

const shareService = {
	/**
	 * 创建邮箱分享链接（需要登录）
	 * @param {object} c - context
	 * @param {object} params - 参数
	 * @param {number} params.accountId - 邮箱账号 ID
	 * @param {number} params.expiresIn - 有效期（毫秒），默认 24 小时
	 * @param {number} userId - 用户 ID
	 * @returns {object} 分享信息
	 */
	async createEmailShare(c, params, userId, isAdmin = false) {
		const { accountId, expiresIn = 86400000, password = '' } = params;
		const sharePassword = String(password || '').trim();

		const accountRow = await accountService.selectById(c, accountId);
		if (!accountRow) {
			throw new Error('账号不存在');
		}
		if (!isAdmin && accountRow.userId !== userId) {
			throw new Error('无权限分享此邮箱');
		}

		const oldShareId = await c.env.kv.get(EMAIL_SHARE_INDEX_PREFIX + accountId);
		if (oldShareId) {
			await c.env.kv.delete(SHARE_PREFIX + oldShareId);
		}

		// 生成分享 ID
		const shareId = generateShareId(12);

		// 计算过期时间
		const expiresAt = Date.now() + expiresIn;

		// 存储分享信息
		const shareData = {
			shareId,
			accountId,
			email: accountRow.email,
			password: sharePassword,
			userId: accountRow.userId,
			type: 'email',
			expiresAt,
			createdAt: Date.now()
		};

		await c.env.kv.put(
			SHARE_PREFIX + shareId,
			JSON.stringify(shareData),
			{ expirationTtl: Math.floor(expiresIn / 1000) }
		);
		await c.env.kv.put(
			EMAIL_SHARE_INDEX_PREFIX + accountId,
			shareId,
			{ expirationTtl: Math.floor(expiresIn / 1000) }
		);

		const shareUrl = new URL(`/share/${shareId}`, new URL(c.req.url).origin);
		shareUrl.searchParams.set('email', accountRow.email);

		return {
			shareId,
			shareUrl: shareUrl.toString(),
			expiresAt: new Date(expiresAt).toISOString()
		};
	},

	/**
	 * 创建单封邮件分享链接
	 * @param {object} c - context
	 * @param {object} params - 参数
	 * @param {number} params.emailId - 邮件 ID
	 * @param {number} params.expiresIn - 有效期（毫秒），默认 24 小时
	 * @param {number} userId - 用户 ID
	 * @returns {object} 分享信息
	 */
	async createMessageShare(c, params, userId) {
		const { emailId, expiresIn = 86400000, password = '' } = params;
		const sharePassword = String(password || '').trim();

		// 验证邮件归属
		const emailRow = await emailService.selectById(c, emailId);
		if (!emailRow) {
			throw new Error('邮件不存在');
		}
		if (emailRow.userId !== userId) {
			throw new Error('无权限分享此邮件');
		}

		// 生成分享 ID
		const shareId = generateShareId(12);

		// 计算过期时间
		const expiresAt = Date.now() + expiresIn;

		// 存储分享信息
		const shareData = {
			shareId,
			emailId,
			accountId: emailRow.accountId,
			password: sharePassword,
			userId,
			type: 'message',
			expiresAt,
			createdAt: Date.now()
		};

		await c.env.kv.put(
			SHARE_PREFIX + shareId,
			JSON.stringify(shareData),
			{ expirationTtl: Math.floor(expiresIn / 1000) }
		);

		const shareUrl = new URL(`/share/${shareId}`, new URL(c.req.url).origin);
		shareUrl.searchParams.set('email', emailRow.toEmail || emailRow.sendEmail || '');

		return {
			shareId,
			shareUrl: shareUrl.toString(),
			expiresAt: new Date(expiresAt).toISOString()
		};
	},

	/**
	 * 获取分享信息（公开访问）
	 * @param {object} c - context
	 * @param {string} shareId - 分享 ID
	 * @returns {object} 分享内容
	 */
	async getShare(c, shareId) {
		const shareDataStr = await c.env.kv.get(SHARE_PREFIX + shareId);
		if (!shareDataStr) {
			throw new Error('分享链接不存在或已过期');
		}

		const shareData = JSON.parse(shareDataStr);

		// 检查是否过期
		if (shareData.expiresAt < Date.now()) {
			throw new Error('分享链接已过期');
		}

		if (shareData.type === 'email') {
			// 返回邮箱的所有邮件列表
			return await this._getEmailShareContent(c, shareData);
		} else if (shareData.type === 'message') {
			// 返回单封邮件内容
			return await this._getMessageShareContent(c, shareData);
		}

		throw new Error('未知的分享类型');
	},

	/**
	 * 获取邮箱分享内容
	 */
	async _getEmailShareContent(c, shareData) {
		const { accountId, email } = shareData;

		const accountRow = await accountService.selectById(c, accountId);
		if (!accountRow || accountRow.userId !== shareData.userId) {
			throw new Error('分享邮箱不存在');
		}

		const { list } = await emailService.list(c, {
			accountId,
			type: 0,
			size: 50,
			timeSort: 0,
			allReceive: 0
		}, shareData.userId);

		return {
			type: 'email',
			email,
			password: shareData.password || '',
			messages: await Promise.all(list.map(async msg => {
				const fullMsg = await emailService.selectById(c, msg.emailId);
				return {
					emailId: msg.emailId,
					sendEmail: msg.sendEmail,
					name: msg.name,
					subject: msg.subject,
					text: shareText(fullMsg || msg),
					html: shareHtml(fullMsg || msg),
					createTime: msg.createTime,
					unread: msg.unread
				};
			}))
		};
	},

	/**
	 * 获取邮件分享内容
	 */
	async _getMessageShareContent(c, shareData) {
		const { emailId } = shareData;

		const emailRow = await emailService.selectById(c, emailId);
		if (!emailRow || emailRow.userId !== shareData.userId) {
			throw new Error('邮件不存在');
		}

		// 获取附件列表
		const attList = await attService.selectByEmailIds(c, [emailId]);

		return {
			type: 'message',
			password: shareData.password || '',
			email: {
				emailId: emailRow.emailId,
				sendEmail: emailRow.sendEmail,
				name: emailRow.name,
				subject: emailRow.subject,
				text: shareText(emailRow),
				html: shareHtml(emailRow),
				toEmail: emailRow.toEmail,
				createTime: emailRow.createTime
			},
			attachments: attList.map(att => ({
				attId: att.attId,
				name: att.name,
				size: att.size,
				type: att.type
			}))
		};
	},

	/**
	 * 删除分享链接
	 * @param {object} c - context
	 * @param {string} shareId - 分享 ID
	 * @param {number} userId - 用户 ID
	 */
	async deleteShare(c, shareId, userId) {
		const shareDataStr = await c.env.kv.get(SHARE_PREFIX + shareId);
		if (!shareDataStr) {
			throw new Error('分享链接不存在');
		}

		const shareData = JSON.parse(shareDataStr);
		if (shareData.userId !== userId) {
			throw new Error('无权限删除此分享');
		}

		await c.env.kv.delete(SHARE_PREFIX + shareId);
		if (shareData.type === 'email') {
			const currentShareId = await c.env.kv.get(EMAIL_SHARE_INDEX_PREFIX + shareData.accountId);
			if (currentShareId === shareId) {
				await c.env.kv.delete(EMAIL_SHARE_INDEX_PREFIX + shareData.accountId);
			}
		}
		return { success: true };
	}
};

export default shareService;