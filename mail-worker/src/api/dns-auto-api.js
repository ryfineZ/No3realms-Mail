import app from '../hono/hono';
import result from '../model/result';
import dnsAutoService from '../service/dns-auto-service';
import userContext from '../security/user-context';

app.post('/domain/detectProvider', async (c) => {
	const userId = await userContext.getUserId(c);
	const res = await dnsAutoService.detectProvider(c, await c.req.json(), userId);
	return c.json(result.ok(res));
});

app.post('/domain/autoConfigure', async (c) => {
	const userId = await userContext.getUserId(c);
	const res = await dnsAutoService.autoConfigure(c, await c.req.json(), userId);
	return c.json(result.ok(res));
});
