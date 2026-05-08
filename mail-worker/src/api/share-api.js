import app from '../hono/hono';
import result from '../model/result';
import shareService from '../service/share-service';
import userContext from '../security/user-context';

// 创建邮箱分享链接（需要登录）
app.post('/share/email', async (c) => {
	const user = userContext.getUser(c);
	const data = await shareService.createEmailShare(
		c,
		await c.req.json(),
		userContext.getUserId(c),
		user.email === c.env.admin
	);
	return c.json(result.ok(data));
});

// 创建邮件分享链接（需要登录）
app.post('/share/message', async (c) => {
	const data = await shareService.createMessageShare(
		c,
		await c.req.json(),
		userContext.getUserId(c)
	);
	return c.json(result.ok(data));
});

// 获取分享内容（公开访问，无需登录）
app.get('/share/:shareId', async (c) => {
	const shareId = c.req.param('shareId');
	const data = await shareService.getShare(c, shareId);
	return c.json(result.ok(data));
});

// 删除分享链接（需要登录）
app.delete('/share/:shareId', async (c) => {
	const shareId = c.req.param('shareId');
	await shareService.deleteShare(c, shareId, userContext.getUserId(c));
	return c.json(result.ok());
});