import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const apiKey = sqliteTable('api_key', {
	apiKeyId: integer('api_key_id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	name: text('name').notNull().default(''),
	keyHash: text('key_hash').notNull(),
	keyPrefix: text('key_prefix').notNull(),
	key: text('key'),
	createTime: text('create_time').default(sql`CURRENT_TIMESTAMP`),
	lastUsedTime: text('last_used_time'),
});

export default apiKey;
