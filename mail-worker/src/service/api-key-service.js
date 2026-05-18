import { and, eq } from 'drizzle-orm';
import orm from '../entity/orm';
import apiKeyEntity from '../entity/api-key';
import userService from './user-service';
import BizError from '../error/biz-error';
import { t } from '../i18n/i18n';

const encoder = new TextEncoder();
const API_KEY_PREFIX = 'cm_';

function randomApiKey() {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return API_KEY_PREFIX + Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

async function sha256(text) {
	const digest = await crypto.subtle.digest('SHA-256', encoder.encode(text));
	return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function maskKey(key) {
	return key.slice(0, 8) + '...' + key.slice(-4);
}

export function resolveApiKeyTargetUserId(params, currentUserId) {
	const rawUserId = params?.userId;
	if (rawUserId === undefined || rawUserId === null || rawUserId === '') {
		return Number(currentUserId);
	}

	const targetUserId = Number(rawUserId);
	if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
		throw new BizError('用户不存在', 400);
	}
	return targetUserId;
}

export function assertApiKeyTargetUser(c, currentUser, targetUserId) {
	if (Number(currentUser.userId) === Number(targetUserId)) {
		return;
	}

	assertApiKeyAdmin(c, currentUser);
}

export function assertApiKeyAdmin(c, currentUser) {
	if (currentUser.email !== c.env.admin) {
		throw new BizError(t('unauthorized'), 403);
	}
}

async function assertApiKeyTargetExists(c, targetUserId) {
	const targetUser = await userService.selectById(c, targetUserId);
	if (!targetUser) {
		throw new BizError('用户不存在', 400);
	}
}

const apiKeyService = {
	async create(c, params, userId) {
		const name = String(params?.name || '').trim().slice(0, 30) || 'API Key';
		const key = randomApiKey();
		const keyHash = await sha256(key);
		const keyPrefix = key.slice(0, 8);

		const row = await orm(c).insert(apiKeyEntity).values({ userId, name, keyHash, keyPrefix, key }).returning().get();

		return {
			apiKeyId: row.apiKeyId,
			name: row.name,
			key,
			keyPreview: maskKey(key),
			createTime: row.createTime,
			lastUsedTime: row.lastUsedTime,
		};
	},

	async list(c, userId) {
		const rows = await orm(c).select().from(apiKeyEntity).where(eq(apiKeyEntity.userId, userId)).all();
		return rows.map(row => ({
			apiKeyId: row.apiKeyId,
			name: row.name,
			key: row.key,
			keyPreview: row.key ? maskKey(row.key) : row.keyPrefix + '...',
			createTime: row.createTime,
			lastUsedTime: row.lastUsedTime,
		}));
	},

	listForTarget(c, params, currentUser) {
		const targetUserId = resolveApiKeyTargetUserId(params, currentUser.userId);
		assertApiKeyTargetUser(c, currentUser, targetUserId);
		return this.list(c, targetUserId);
	},

	async createForTarget(c, params, currentUser) {
		const targetUserId = resolveApiKeyTargetUserId(params, currentUser.userId);
		assertApiKeyTargetUser(c, currentUser, targetUserId);
		await assertApiKeyTargetExists(c, targetUserId);
		return this.create(c, params, targetUserId);
	},

	async delete(c, params, userId) {
		await orm(c).delete(apiKeyEntity).where(
			and(eq(apiKeyEntity.apiKeyId, Number(params.apiKeyId)), eq(apiKeyEntity.userId, userId))
		).run();
	},

	deleteForTarget(c, params, currentUser) {
		const targetUserId = resolveApiKeyTargetUserId(params, currentUser.userId);
		assertApiKeyTargetUser(c, currentUser, targetUserId);
		return this.delete(c, params, targetUserId);
	},

	async auth(c, rawKey) {
		if (!rawKey?.startsWith(API_KEY_PREFIX)) return null;
		const keyHash = await sha256(rawKey);
		const row = await orm(c).select().from(apiKeyEntity).where(eq(apiKeyEntity.keyHash, keyHash)).get();
		if (!row) return null;

		const user = await userService.selectById(c, row.userId);
		if (!user) return null;

		await orm(c).update(apiKeyEntity).set({ lastUsedTime: new Date().toISOString() })
			.where(eq(apiKeyEntity.apiKeyId, row.apiKeyId)).run();

		return { user, token: `api-key:${row.apiKeyId}` };
	}
};

export default apiKeyService;
