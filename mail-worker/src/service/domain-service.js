import orm from '../entity/orm';
import domainEntity from '../entity/domain';
import { eq, and } from 'drizzle-orm';
import BizError from '../error/biz-error';
import { t } from '../i18n/i18n';
import KvConst from '../const/kv-const';
import cloudflareProvider from '../dns-provider/cloudflare-provider.js';

const DOMAIN_CACHE_TTL = 300; // 5 分钟

const domainService = {

	_format(row) {
		if (!row) return row;
		const { isSystem, ...domain } = row;
		return domain;
	},

	_formatList(rows) {
		return rows.map(row => this._format(row));
	},

	// 查找可用域名（用于创建邮箱地址时校验），支持子域名匹配
	async findVerifiedDomain(c, emailDomain, userId, isAdmin) {
		const matchDomain = row => {
			if (!row.enabled) return false;
			if (row.domain === emailDomain) return true;
			if (row.allowSubdomain && emailDomain.endsWith('.' + row.domain)) return true;
			return false;
		};

		const domains = await this._getCachedDomains(c);
		let found = domains.find(matchDomain) || null;
		if (found) return found;

		if (isAdmin) {
			found = (await this.listAllVerified(c)).find(matchDomain) || null;
			return found;
		}

		if (userId) {
			const myDomains = await this.listByUserId(c, userId);
			found = myDomains.filter(d => d.status === 'verified').find(matchDomain) || null;
		}
		return found;
	},

	// 获取所有公开可用域名（供前端创建邮箱时展示）
	async listPublic(c) {
		const domains = await this._getCachedDomains(c);
		return this._formatList(domains.filter(row => row.isPublic && row.enabled));
	},

	// 获取某用户贡献的域名列表
	async listByUserId(c, userId) {
		return this._formatList(await orm(c).select().from(domainEntity).where(eq(domainEntity.userId, userId)).all());
	},

	async _selectManageableById(c, domainId, userId, isAdmin = false) {
		if (isAdmin) {
			return orm(c).select().from(domainEntity).where(eq(domainEntity.domainId, Number(domainId))).get();
		}
		return orm(c).select().from(domainEntity).where(
			and(eq(domainEntity.domainId, Number(domainId)), eq(domainEntity.userId, userId))
		).get();
	},

	// 获取所有已验证域名（管理员用）
	async listAllVerified(c) {
		return this._formatList(await orm(c).select().from(domainEntity).where(
			and(eq(domainEntity.status, 'verified'), eq(domainEntity.enabled, 1))
		).all());
	},

	async listAllVerifiedIncludeDisabled(c) {
		return this._formatList(await orm(c).select().from(domainEntity).where(eq(domainEntity.status, 'verified')).all());
	},

	// 用户添加域名（生成验证 token）
	async add(c, params, userId) {
		let { domain, isPublic } = params;

		if (!domain) throw new BizError(t('emptyDomain'));

		domain = domain.trim().toLowerCase();

		if (!/^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(domain)) {
			throw new BizError(t('notEmailDomain'));
		}

		const existing = await orm(c).select().from(domainEntity).where(eq(domainEntity.domain, domain)).get();
		if (existing) throw new BizError(t('domainAlreadyExist'));

		const verifyToken = 'cloudmail-' + Array.from(crypto.getRandomValues(new Uint8Array(6)))
			.map(b => b.toString(16).padStart(2, '0')).join('');

		const row = await orm(c).insert(domainEntity).values({
			domain,
			userId,
			status: 'pending',
			verifyToken,
			isPublic: isPublic ? 1 : 0,
		}).returning().get();

		return this._format(row);
	},

	// 触发 DNS 验证
	async verify(c, params, userId, isAdmin = false) {
		const { domainId } = params;

		const row = await this._selectManageableById(c, domainId, userId, isAdmin);

		if (!row) throw new BizError(t('domainNotExist'));

		const checks = await this._checkDnsRecords(row.domain, row.verifyToken);

		const now = new Date().toISOString();

		if (checks.txtOk && checks.mxOk) {
			await orm(c).update(domainEntity).set({
				status: 'verified',
				verifyTime: now,
				lastCheck: now,
			}).where(eq(domainEntity.domainId, row.domainId)).run();
			await this._clearCache(c);
			return { verified: true, checks };
		}

		await orm(c).update(domainEntity).set({ lastCheck: now }).where(eq(domainEntity.domainId, row.domainId)).run();

		return { verified: false, checks };
	},

	// 切换公开分享
	async setPublic(c, params, userId, isAdmin = false) {
		const { domainId, isPublic } = params;

		const row = await this._selectManageableById(c, domainId, userId, isAdmin);

		if (!row) throw new BizError(t('domainNotExist'));
		if (row.status !== 'verified') throw new BizError(t('domainNotVerified'));

		await orm(c).update(domainEntity).set({ isPublic: isPublic ? 1 : 0 }).where(eq(domainEntity.domainId, row.domainId)).run();
		await this._clearCache(c);
	},

	// 删除域名
	async delete(c, params, userId, isAdmin = false) {
		const { domainId } = params;

		const row = await this._selectManageableById(c, domainId, userId, isAdmin);

		if (!row) throw new BizError(t('domainNotExist'));

		await orm(c).delete(domainEntity).where(eq(domainEntity.domainId, row.domainId)).run();
		await this._clearCache(c);
	},

	// 检测域名 DNS 托管商
	async detectProvider(c, params, userId, isAdmin = false) {
		const { domainId } = params;
		const row = await this._selectManageableById(c, domainId, userId, isAdmin);
		if (!row) throw new BizError(t('domainNotExist'));

		const nsResult = await this._queryDns(row.domain, 'NS');
		const nameservers = (nsResult.Answer || []).map(a => (a.data || '').toLowerCase());
		if (nameservers.some(ns => ns.includes('cloudflare'))) {
			return { provider: 'cloudflare' };
		}
		return { provider: 'unknown' };
	},

	// 自动配置 DNS 记录
	async autoConfigure(c, params, userId, isAdmin = false) {
		const { domainId, provider, credentials } = params;
		const row = await this._selectManageableById(c, domainId, userId, isAdmin);
		if (!row) throw new BizError(t('domainNotExist'));

		if (provider === 'cloudflare') {
			const results = await cloudflareProvider.configureRecords(credentials.apiToken, row.domain, row.verifyToken);
			const allSuccess = results.every(r => r.success);
			return { results, allSuccess };
		}

		throw new BizError('Unsupported DNS provider');
	},

	// 管理员：所有域名列表
	async adminList(c) {
		return this._formatList(await orm(c).select().from(domainEntity).all());
	},

	async setEnabled(c, params, userId, isAdmin = false) {
		const { domainId, enabled } = params;
		const row = await this._selectManageableById(c, domainId, userId, isAdmin);
		if (!row) throw new BizError(t('domainNotExist'));
		await orm(c).update(domainEntity).set({ enabled: enabled ? 1 : 0 }).where(eq(domainEntity.domainId, row.domainId)).run();
		await this._clearCache(c);
	},

	// 管理员：审批通过
	async adminApprove(c, params) {
		const { domainId } = params;
		const now = new Date().toISOString();
		await orm(c).update(domainEntity).set({ status: 'verified', verifyTime: now }).where(eq(domainEntity.domainId, Number(domainId))).run();
		await this._clearCache(c);
	},

	// 管理员：拒绝
	async adminReject(c, params) {
		const { domainId } = params;
		await orm(c).update(domainEntity).set({ status: 'rejected' }).where(eq(domainEntity.domainId, Number(domainId))).run();
	},

	// --- 内部方法 ---

	async _getCachedDomains(c) {
		const cached = await c.env.kv.get(KvConst.DOMAIN_LIST, { type: 'json' });
		if (cached) return cached;

		const rows = await orm(c).select().from(domainEntity).where(
			and(eq(domainEntity.status, 'verified'), eq(domainEntity.isPublic, 1), eq(domainEntity.enabled, 1))
		).all();

		await c.env.kv.put(KvConst.DOMAIN_LIST, JSON.stringify(rows), { expirationTtl: DOMAIN_CACHE_TTL });
		return rows;
	},


	async _clearCache(c) {
		await c.env.kv.delete(KvConst.DOMAIN_LIST);
	},

	// DNS 验证（Cloudflare DoH）
	async _checkDnsRecords(domain, token) {
		const [txtResult, mxResult, wildcardMxResult] = await Promise.all([
			this._queryDns(`_cloudmail-verify.${domain}`, 'TXT'),
			this._queryDns(domain, 'MX'),
			this._queryDns(`*.${domain}`, 'MX'),
		]);

		const txtOk = (txtResult.Answer || []).some(a =>
			(a.data || '').replace(/"/g, '').includes(token)
		);
		const mxOk = (mxResult.Answer || []).length > 0 || (wildcardMxResult.Answer || []).length > 0;

		return { txtOk, mxOk, txtRecords: txtResult.Answer || [], mxRecords: mxResult.Answer || [], wildcardMxRecords: wildcardMxResult.Answer || [] };
	},

	async _queryDns(name, type) {
		try {
			const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, {
				headers: { Accept: 'application/dns-json' },
			});
			return await res.json();
		} catch {
			return { Answer: [] };
		}
	},
};

export default domainService;
