import app from '../hono/hono';
import accountService from '../service/account-service';
import domainService from '../service/domain-service';
import result from '../model/result';
import userContext from '../security/user-context';

app.get('/account/list', async (c) => {
	const user = userContext.getUser(c);
	const list = await accountService.list(c, c.req.query(), userContext.getUserId(c), user.email === c.env.admin);
	return c.json(result.ok(list));
});

app.delete('/account/delete', async (c) => {
	await accountService.delete(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.post('/account/add', async (c) => {
	const account = await accountService.add(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(account));
});

app.put('/account/setName', async (c) => {
	await accountService.setName(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.put('/account/setAllReceive', async (c) => {
	await accountService.setAllReceive(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.put('/account/setAsTop', async (c) => {
	await accountService.setAsTop(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

// 生成随机邮箱地址（不创建，仅生成建议值）
app.get('/account/random', async (c) => {
	const { domainId, subLevels } = c.req.query();
	const userId = await userContext.getUserId(c);
	const user = userContext.getUser(c);
	const isAdmin = user.email === c.env.admin;

	let allDomains;
	if (isAdmin) {
		// 管理员可用所有已验证域名
		allDomains = await domainService.listAllVerified(c);
	} else {
		const publicDomains = await domainService.listPublic(c);
		const myDomains = await domainService.listByUserId(c, userId);
		const seen = new Set();
		allDomains = [];
		for (const d of [...publicDomains, ...myDomains]) {
			if (!seen.has(d.domainId) && d.status === 'verified' && d.enabled) {
				seen.add(d.domainId);
				allDomains.push(d);
			}
		}
	}

	if (allDomains.length === 0) {
		return c.json(result.fail('No available domains'));
	}

	let targetDomain;
	if (domainId) {
		targetDomain = allDomains.find(d => String(d.domainId) === String(domainId));
	}
	if (!targetDomain) {
		targetDomain = allDomains[Math.floor(Math.random() * allDomains.length)];
	}

	// 支持随机子域名
	let finalDomain = targetDomain.domain;
	if (targetDomain.allowSubdomain || !targetDomain.isPublic) {
		let level = 1;
		if (subLevels) {
			const levels = String(subLevels).split(',').map(Number).filter(n => n >= 2 && n <= 10);
			if (levels.length > 0) {
				level = levels[Math.floor(Math.random() * levels.length)] - 1;
			}
		} else {
			level = 1;
		}
		const segs = Array.from({ length: level }, () => _randomStr(_randomInt(1, 3)));
		finalDomain = segs.length > 0 ? segs.join('.') + '.' + targetDomain.domain : targetDomain.domain;
	}

	const prefix = _randomStr(_randomInt(1, 4));
	const email = `${prefix}@${finalDomain}`;

	return c.json(result.ok({ email, prefix, domain: finalDomain, domainId: targetDomain.domainId }));
});

function _randomInt(min, max) {
	return min + crypto.getRandomValues(new Uint8Array(1))[0] % (max - min + 1);
}

function _randomStr(len) {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	return Array.from(crypto.getRandomValues(new Uint8Array(len)))
		.map(b => chars[b % chars.length]).join('');
}
