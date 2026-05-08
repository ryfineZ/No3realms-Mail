import dnsProviderDetect from '../dns-provider/dns-provider-detect';
import cloudflareProvider from '../dns-provider/cloudflare-provider';
import { DnsProvider } from '../dns-provider/dns-provider-const';
import orm from '../entity/orm.js';
import { domain } from '../entity/domain.js';
import { eq, and } from 'drizzle-orm';
import BizError from '../error/biz-error';
import { t } from '../i18n/i18n';

const dnsAutoService = {
	async detectProvider(c, params, userId) {
		const row = await this._getUserDomain(c, params.domainId, userId);
		const result = await dnsProviderDetect.detect(row.domain);
		return { domain: row.domain, ...result };
	},

	async autoConfigure(c, params, userId) {
		const { domainId, provider, credentials } = params;

		if (!credentials?.apiToken) {
			throw new BizError(t('dnsCredentialRequired'));
		}

		const row = await this._getUserDomain(c, domainId, userId);

		if (provider !== DnsProvider.CLOUDFLARE) {
			throw new BizError(t('dnsProviderNotSupported'));
		}

		const results = await cloudflareProvider.configureRecords(
			credentials.apiToken, row.domain, row.verifyToken
		);

		return { domain: row.domain, results, allSuccess: results.every(r => r.success) };
	},

	async _getUserDomain(c, domainId, userId) {
		const row = await orm(c).select().from(domain).where(
			and(eq(domain.domainId, Number(domainId)), eq(domain.userId, userId))
		).get();
		if (!row) throw new BizError(t('domainNotExist'));
		return row;
	},
};

export default dnsAutoService;
