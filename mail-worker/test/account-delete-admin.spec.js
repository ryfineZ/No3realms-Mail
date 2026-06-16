import { describe, expect, it } from 'vitest';
import { assertAccountDeleteAllowed, assertAccountManageAllowed, collectAccountTags } from '../src/service/account-service';

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

	it('allows super admin to manage another user mailbox tags', () => {
		expect(() => assertAccountManageAllowed(
			{ env: { admin: 'admin@example.com' } },
			{ userId: 1, email: 'admin@example.com' },
			{ userId: 2, email: 'box@example.com' }
		)).not.toThrow();
	});

	it('blocks normal users from managing another user mailbox tags', () => {
		expect(() => assertAccountManageAllowed(
			{ env: { admin: 'admin@example.com' } },
			{ userId: 1, email: 'user@example.com' },
			{ userId: 2, email: 'box@example.com' }
		)).toThrow('该邮箱不属于当前用户');
	});

	it('collects reusable mailbox tags', () => {
		expect(collectAccountTags([
			{ tags: '["注册","测试项目"]' },
			{ tags: '["注册","客户"]' },
			{ tags: '' },
		])).toEqual(['注册', '测试项目', '客户']);
	});
});
