import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const domain = sqliteTable('domain', {
	domainId: integer('domain_id').primaryKey({ autoIncrement: true }),
	domain: text('domain').notNull(),
	userId: integer('user_id').notNull().default(0),
	status: text('status').notNull().default('pending'), // pending / verified / rejected
	verifyToken: text('verify_token'),
	isPublic: integer('is_public').notNull().default(0),
	isSystem: integer('is_system').notNull().default(0),
	allowSubdomain: integer('allow_subdomain').notNull().default(1),
	enabled: integer('enabled').notNull().default(1),
	createTime: text('create_time').default(sql`CURRENT_TIMESTAMP`),
	verifyTime: text('verify_time'),
	lastCheck: text('last_check'),
});

export default domain;
