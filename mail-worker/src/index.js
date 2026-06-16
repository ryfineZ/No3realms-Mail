import app from './hono/webs';
import { email } from './email/email';
import userService from './service/user-service';
import verifyRecordService from './service/verify-record-service';
import emailService from './service/email-service';
import kvObjService from './service/kv-obj-service';
import oauthService from "./service/oauth-service";
import KvConst from './const/kv-const';

const DEFAULT_SITE_TITLE = 'No3realms-Mail';

function escapeHtml(value) {
	return String(value || '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function isSharePageRequest(req, url) {
	if (req.method !== 'GET') return false;
	if (!url.pathname.startsWith('/share/')) return false;
	const accept = req.headers.get('Accept') || '';
	return !accept || accept.includes('text/html') || accept.includes('*/*');
}

async function getSiteTitle(env) {
	try {
		const setting = await env.kv?.get(KvConst.SETTING, { type: 'json' });
		return String(setting?.title || '').trim() || DEFAULT_SITE_TITLE;
	} catch {
		return DEFAULT_SITE_TITLE;
	}
}

function upsertMeta(html, title, description, url) {
	const safeTitle = escapeHtml(title);
	const safeDescription = escapeHtml(description);
	const safeUrl = escapeHtml(url);
	const metaTags = [
		`<meta property="og:type" content="website">`,
		`<meta property="og:title" content="${safeTitle}">`,
		`<meta property="og:description" content="${safeDescription}">`,
		`<meta property="og:url" content="${safeUrl}">`,
		`<meta name="twitter:card" content="summary">`,
		`<meta name="twitter:title" content="${safeTitle}">`,
		`<meta name="twitter:description" content="${safeDescription}">`,
	].join('\n  ');

	let nextHtml = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
	nextHtml = nextHtml.replace(
		/<meta\s+name=["']description["'][^>]*>/i,
		`<meta name="description" content="${safeDescription}">`
	);
	nextHtml = nextHtml.replace(/\n?\s*<meta\s+(?:property|name)=["'](?:og:[^"']+|twitter:[^"']+)["'][^>]*>/gi, '');
	return nextHtml.replace(/<\/head>/i, `  ${metaTags}\n</head>`);
}

async function serveSharePage(req, env, url) {
	const response = await env.assets.fetch(req);
	const contentType = response.headers.get('content-type') || '';
	if (!contentType.includes('text/html')) {
		return response;
	}

	const siteTitle = await getSiteTitle(env);
	const email = String(url.searchParams.get('email') || '').trim();
	const title = email ? `${email} 的只读邮箱分享` : `${siteTitle} 邮箱分享`;
	const description = email ? `打开这个只读分享，查看 ${email} 收到的邮件。` : '打开这个只读邮箱分享，查看收到的邮件。';
	const html = upsertMeta(await response.text(), title, description, url.toString());
	const headers = new Headers(response.headers);
	headers.set('content-type', 'text/html; charset=UTF-8');
	return new Response(html, { status: response.status, statusText: response.statusText, headers });
}

export default {
	 async fetch(req, env, ctx) {

		const url = new URL(req.url)

		if (url.pathname.startsWith('/api/')) {
			url.pathname = url.pathname.replace('/api', '')
			req = new Request(url.toString(), req)
			return app.fetch(req, env, ctx);
		}

		 if (['/static/','/attachments/'].some(p => url.pathname.startsWith(p))) {
			 return await kvObjService.toObjResp( { env }, url.pathname.substring(1));
		 }

		if (isSharePageRequest(req, url)) {
			return serveSharePage(req, env, url);
		}

		return env.assets.fetch(req);
	},
	email: email,
	async scheduled(c, env, ctx) {
		await verifyRecordService.clearRecord({ env })
		await userService.resetDaySendCount({ env })
		await emailService.completeReceiveAll({ env })
		await emailService.cleanExpiredEmails({ env })
		await oauthService.clearNoBindOathUser({ env })
	},
};
