import app from '../hono/hono';
import result from '../model/result';
import domainService from '../service/domain-service';
import userContext from '../security/user-context';

// 获取公开可用域名列表（无需登录，供注册/添加邮箱时展示）
app.get('/domain/public', async (c) => {
	const list = await domainService.listPublic(c);
	return c.json(result.ok(list));
});

// 获取当前用户添加的域名列表
app.get('/domain/my', async (c) => {
	const userId = await userContext.getUserId(c);
	const list = await domainService.listByUserId(c, userId);
	return c.json(result.ok(list));
});

// 获取当前用户可用于创建邮箱的域名列表
app.get('/domain/available', async (c) => {
	const userId = await userContext.getUserId(c);
	const user = userContext.getUser(c);
	const isAdmin = user.email === c.env.admin;

	if (isAdmin) {
		return c.json(result.ok(await domainService.listAllVerified(c)));
	}

	const publicDomains = await domainService.listPublic(c);
	const myDomains = await domainService.listByUserId(c, userId);
	const seen = new Set();
	const list = [];
	for (const domain of [...publicDomains, ...myDomains]) {
		if (!seen.has(domain.domainId) && domain.status === 'verified' && domain.enabled) {
			seen.add(domain.domainId);
			list.push(domain);
		}
	}
	return c.json(result.ok(list));
});

// 添加域名
app.post('/domain/add', async (c) => {
	const userId = await userContext.getUserId(c);
	const row = await domainService.add(c, await c.req.json(), userId);
	return c.json(result.ok(row));
});

// 触发 DNS 验证
app.post('/domain/verify', async (c) => {
	const userId = await userContext.getUserId(c);
	const user = userContext.getUser(c);
	const res = await domainService.verify(c, await c.req.json(), userId, user.email === c.env.admin);
	return c.json(result.ok(res));
});

// 切换公开分享
app.post('/domain/setPublic', async (c) => {
	const userId = await userContext.getUserId(c);
	const user = userContext.getUser(c);
	await domainService.setPublic(c, await c.req.json(), userId, user.email === c.env.admin);
	return c.json(result.ok());
});

// 切换启用状态
app.post('/domain/setEnabled', async (c) => {
	const userId = await userContext.getUserId(c);
	const user = userContext.getUser(c);
	await domainService.setEnabled(c, await c.req.json(), userId, user.email === c.env.admin);
	return c.json(result.ok());
});

// 删除域名
app.delete('/domain/delete', async (c) => {
	const userId = await userContext.getUserId(c);
	const user = userContext.getUser(c);
	await domainService.delete(c, c.req.query(), userId, user.email === c.env.admin);
	return c.json(result.ok());
});

// 检测域名 DNS 托管商
app.post('/domain/detectProvider', async (c) => {
	const userId = await userContext.getUserId(c);
	const user = userContext.getUser(c);
	const res = await domainService.detectProvider(c, await c.req.json(), userId, user.email === c.env.admin);
	return c.json(result.ok(res));
});

// 自动配置 DNS 记录
app.post('/domain/autoConfigure', async (c) => {
	const userId = await userContext.getUserId(c);
	const user = userContext.getUser(c);
	const res = await domainService.autoConfigure(c, await c.req.json(), userId, user.email === c.env.admin);
	return c.json(result.ok(res));
});

// 管理员：所有域名
app.get('/domain/admin', async (c) => {
	const list = await domainService.adminList(c);
	return c.json(result.ok(list));
});

// 管理员：审批通过
app.post('/domain/adminApprove', async (c) => {
	await domainService.adminApprove(c, await c.req.json());
	return c.json(result.ok());
});

// 管理员：拒绝
app.post('/domain/adminReject', async (c) => {
	await domainService.adminReject(c, await c.req.json());
	return c.json(result.ok());
});
