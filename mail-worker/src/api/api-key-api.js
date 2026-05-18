import app from '../hono/hono';
import result from '../model/result';
import apiKeyService from '../service/api-key-service';
import userContext from '../security/user-context';

app.get('/apiKey/list', async (c) => {
	const list = await apiKeyService.listForTarget(c, c.req.query(), userContext.getUser(c));
	return c.json(result.ok(list));
});

app.post('/apiKey/create', async (c) => {
	const row = await apiKeyService.createForTarget(c, await c.req.json(), userContext.getUser(c));
	return c.json(result.ok(row));
});

app.delete('/apiKey/delete', async (c) => {
	await apiKeyService.deleteForTarget(c, c.req.query(), userContext.getUser(c));
	return c.json(result.ok());
});
