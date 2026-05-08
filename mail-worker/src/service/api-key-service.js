import { and, eq } from 'drizzle-orm';
import orm from '../entity/orm';
import apiKeyEntity from '../entity/api-key';
import userService from './user-service';

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

	async delete(c, params, userId) {
		await orm(c).delete(apiKeyEntity).where(
			and(eq(apiKeyEntity.apiKeyId, Number(params.apiKeyId)), eq(apiKeyEntity.userId, userId))
		).run();
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
