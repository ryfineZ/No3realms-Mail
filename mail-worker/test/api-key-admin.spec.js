import { describe, expect, it } from 'vitest';
import { assertApiKeyTargetUser, resolveApiKeyTargetUserId } from '../src/service/api-key-service';

describe('api key admin target helpers', () => {
	it('uses current user when target user is not provided', () => {
		expect(resolveApiKeyTargetUserId({}, 12)).toBe(12);
		expect(resolveApiKeyTargetUserId({ userId: '' }, 12)).toBe(12);
	});

	it('uses target user id when provided', () => {
		expect(resolveApiKeyTargetUserId({ userId: '34' }, 12)).toBe(34);
	});

	it('allows super admin to manage another user api keys', () => {
		expect(() => assertApiKeyTargetUser({ env: { admin: 'admin@example.com' } }, {
			email: 'admin@example.com',
			userId: 1,
		}, 2)).not.toThrow();
	});

	it('blocks non-admin from managing another user api keys', () => {
		expect(() => assertApiKeyTargetUser({ env: { admin: 'admin@example.com' } }, {
			email: 'user@example.com',
			userId: 1,
		}, 2)).toThrow('权限不足');
	});
});
