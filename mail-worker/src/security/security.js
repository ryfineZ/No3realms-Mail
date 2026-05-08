import BizError from '../error/biz-error';
import constant from '../const/constant';
import jwtUtils from '../utils/jwt-utils';
import KvConst from '../const/kv-const';
import dayjs from 'dayjs';
import userService from '../service/user-service';
import permService from '../service/perm-service';
import apiKeyService from '../service/api-key-service';
import { t } from '../i18n/i18n'
import app from '../hono/hono';

const exclude = [
	'/login',
	'/register',
	'/oss',
	'/setting/websiteConfig',
	'/webhooks',
	'/init',
	'/public/genToken',
	'/telegram',
	'/test',
	'/oauth',
	'/domain/public', // 公开域名列表，无需认证
	'/temp/',         // 临时邮箱，无需认证
];

const requirePerms = [
	'/email/send',
	'/email/delete',
	'/account/list',
	'/account/delete',
	'/account/add',
	'/my/delete',
	'/analysis/echarts',
	'/role/add',
	'/role/list',
	'/role/delete',
	'/role/tree',
	'/role/set',
	'/role/setDefault',
	'/allEmail/list',
	'/allEmail/delete',
	'/allEmail/batchDelete',
	'/allEmail/latest',
	'/setting/setBackground',
	'/setting/deleteBackground',
	'/setting/set',
	'/setting/query',
	'/user/delete',
	'/user/setPwd',
	'/user/setStatus',
	'/user/setType',
	'/user/list',
	'/user/resetSendCount',
	'/user/add',
	'/user/deleteAccount',
	'/user/allAccount',
	'/regKey/add',
	'/regKey/list',
	'/regKey/delete',
	'/regKey/clearNotUse',
	'/regKey/history',
	'/domain/admin',
	'/domain/adminApprove',
	'/domain/adminReject',
];

const premKey = {
	'email:delete': ['/email/delete'],
	'email:send': ['/email/send'],
	'account:add': ['/account/add'],
	'account:query': ['/account/list'],
	'account:delete': ['/account/delete'],
	'my:delete': ['/my/delete'],
	'role:add': ['/role/add'],
	'role:set': ['/role/set','/role/setDefault'],
	'role:query': ['/role/list', '/role/tree'],
	'role:delete': ['/role/delete'],
	'user:query': ['/user/list','/user/allAccount'],
	'user:add': ['/user/add'],
	'user:reset-send': ['/user/resetSendCount'],
	'user:set-pwd': ['/user/setPwd'],
	'user:set-status': ['/user/setStatus'],
	'user:set-type': ['/user/setType'],
	'user:delete': ['/user/delete','/user/deleteAccount'],
	'all-email:query': ['/allEmail/list','/allEmail/latest'],
	'all-email:delete': ['/allEmail/delete','/allEmail/batchDelete'],
	'setting:query': ['/setting/query'],
	'setting:set': ['/setting/set', '/setting/setBackground','/setting/deleteBackground'],
	'analysis:query': ['/analysis/echarts'],
	'reg-key:add': ['/regKey/add'],
	'reg-key:query': ['/regKey/list','/regKey/history'],
	'reg-key:delete': ['/regKey/delete','/regKey/clearNotUse'],
	'domain:admin': ['/domain/admin', '/domain/adminApprove', '/domain/adminReject'],
};

app.use('*', async (c, next) => {

	const path = c.req.path;

	const index = exclude.findIndex(item => {
		return path.startsWith(item);
	});

	if (index > -1) {
		return await next();
	}

	if (path.startsWith('/public')) {

		const userPublicToken = await c.env.kv.get(KvConst.PUBLIC_KEY);
		const publicToken = c.req.header(constant.TOKEN_HEADER);
		if (publicToken !== userPublicToken) {
			throw new BizError(t('publicTokenFail'), 401);
		}
		return await next();
	}

	// GET /share/:shareId 允许公开访问（查看分享内容），创建/删除需认证
	if (path.startsWith('/share/') && c.req.method === 'GET') {
		return await next();
	}


	const authorization = c.req.header(constant.TOKEN_HEADER);
	const apiKey = parseApiKey(authorization);
	let currentUser = null;
	let authInfo = null;

	if (apiKey) {
		const apiKeyAuth = await apiKeyService.auth(c, apiKey);
		if (apiKeyAuth) {
			currentUser = apiKeyAuth.user;
		}
	}

	if (!currentUser) {
		const result = await jwtUtils.verifyToken(c, authorization);

		if (!result) {
			throw new BizError(t('authExpired'), 401);
		}

		const { userId, token } = result;
		authInfo = await c.env.kv.get(KvConst.AUTH_INFO + userId, { type: 'json' });

		if (!authInfo) {
			throw new BizError(t('authExpired'), 401);
		}

		if (!authInfo.tokens.includes(token)) {
			throw new BizError(t('authExpired'), 401);
		}

		currentUser = authInfo.user;
	}

	const permIndex = requirePerms.findIndex(item => {
		return path.startsWith(item);
	});

	if (permIndex > -1) {

		const permKeys = await permService.userPermKeys(c, currentUser.userId);

		const userPaths = permKeyToPaths(permKeys);

		const userPermIndex = userPaths.findIndex(item => {
			return path.startsWith(item);
		});

		if (userPermIndex === -1 && currentUser.email !== c.env.admin) {
			throw new BizError(t('unauthorized'), 403);
		}

	}

	if (authInfo) {
		const refreshTime = dayjs(authInfo.refreshTime).startOf('day');
		const nowTime = dayjs().startOf('day')

		if (!nowTime.isSame(refreshTime)) {
			authInfo.refreshTime = dayjs().toISOString();
			await userService.updateUserInfo(c, currentUser.userId);
			await c.env.kv.put(KvConst.AUTH_INFO + currentUser.userId, JSON.stringify(authInfo), { expirationTtl: constant.TOKEN_EXPIRE });
		}
	}

	c.set('user', currentUser)

	return await next();
});

function parseApiKey(authorization) {
	if (!authorization) return null;
	const value = authorization.trim();
	if (value.startsWith('Bearer ')) return value.slice(7).trim();
	return value;
}

function permKeyToPaths(permKeys) {

	const paths = [];

	for (const key of permKeys) {
		const routeList = premKey[key];
		if (routeList && Array.isArray(routeList)) {
			paths.push(...routeList);
		}
	}
	return paths;
}
