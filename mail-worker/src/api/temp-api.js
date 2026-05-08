import app from '../hono/hono';
import result from '../model/result';
import KvConst from '../const/kv-const';
import domainService from '../service/domain-service';

const TTL = 1800; // 30 分钟

function randomStr(len) {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let s = '';
	const arr = new Uint8Array(len);
	crypto.getRandomValues(arr);
	arr.forEach(v => (s += chars[v % chars.length]));
	return s;
}

// 创建临时邮箱
app.post('/temp/create', async (c) => {
	const { domainId } = await c.req.json().catch(() => ({}));

	const domains = await domainService.listPublic(c);
	if (!domains.length) return c.json(result.fail('暂无可用域名'));

	let domain = domainId
		? domains.find(d => d.domainId === Number(domainId))
		: domains[0];
	if (!domain) domain = domains[0];

	const prefix = randomStr(10);
	const email = `${prefix}@${domain.domain}`;
	const token = randomStr(32);
	const expiry = Date.now() + TTL * 1000;

	await Promise.all([
		c.env.kv.put(KvConst.TEMP_EMAIL + email, JSON.stringify({ token, expiry }), { expirationTtl: TTL }),
		c.env.kv.put(KvConst.TEMP_SESSION + token, JSON.stringify({ email, expiry }), { expirationTtl: TTL }),
	]);

	return c.json(result.ok({ email, token, expiry, ttl: TTL }));
});

// 查询临时邮箱收件
app.get('/temp/inbox', async (c) => {
	const token = c.req.query('token');
	if (!token) return c.json(result.fail('缺少 token'));

	const session = await c.env.kv.get(KvConst.TEMP_SESSION + token, 'json');
	if (!session) return c.json(result.fail('会话已过期'), 404);

	const inbox = await c.env.kv.get(KvConst.TEMP_INBOX + token, 'json') || [];
	return c.json(result.ok({ email: session.email, expiry: session.expiry, emails: inbox }));
});
