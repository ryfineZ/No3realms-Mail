import { DnsProvider, NS_PATTERNS, PROVIDER_LABELS, PROVIDER_CREDENTIAL_FIELDS } from './dns-provider-const';

const dnsProviderDetect = {
	async detect(domain) {
		const nsResult = await this._queryNs(domain);
		const nsRecords = (nsResult.Answer || []).map(a => a.data);

		for (const [provider, pattern] of Object.entries(NS_PATTERNS)) {
			if (nsRecords.some(ns => pattern.test(ns))) {
				return {
					provider,
					providerLabel: PROVIDER_LABELS[provider],
					nsRecords,
					credentialFields: PROVIDER_CREDENTIAL_FIELDS[provider],
				};
			}
		}
		return {
			provider: DnsProvider.UNKNOWN,
			providerLabel: PROVIDER_LABELS[DnsProvider.UNKNOWN],
			nsRecords,
			credentialFields: null,
		};
	},

	async _queryNs(domain) {
		try {
			const res = await fetch(
				`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NS`,
				{ headers: { Accept: 'application/dns-json' } }
			);
			return await res.json();
		} catch {
			return { Answer: [] };
		}
	},
};

export default dnsProviderDetect;
