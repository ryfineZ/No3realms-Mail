import { describe, expect, it } from 'vitest';
import { assertAccountDeleteAllowed } from '../src/service/account-service';

describe('account delete permissions', () => {
	it('allows super admin to delete another user mailbox', () => {
		expect(() => assertAccountDeleteAllowed(
			{ env: { admin: 'admin@example.com' } },
			{ userId: 1, email: 'admin@example.com' },
			{ userId: 2, email: 'box@example.com' }
		)).not.toThrow();
	});

	it('blocks normal users from deleting another user mailbox', () => {
		expect(() => assertAccountDeleteAllowed(
			{ env: { admin: 'admin@example.com' } },
			{ userId: 1, email: 'user@example.com' },
			{ userId: 2, email: 'box@example.com' }
		)).toThrow('该邮箱不属于当前用户');
	});

	it('blocks deleting the mailbox used by the current login user', () => {
		expect(() => assertAccountDeleteAllowed(
			{ env: { admin: 'admin@example.com' } },
			{ userId: 1, email: 'admin@example.com' },
			{ userId: 1, email: 'admin@example.com' }
		)).toThrow('不可以删除自己的邮箱');
	});
});
