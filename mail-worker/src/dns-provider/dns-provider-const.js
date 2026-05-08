const DnsProvider = {
	CLOUDFLARE: 'cloudflare',
	UNKNOWN: 'unknown',
};

const NS_PATTERNS = {
	[DnsProvider.CLOUDFLARE]: /\.ns\.cloudflare\.com$/i,
};

const PROVIDER_CREDENTIAL_FIELDS = {
	[DnsProvider.CLOUDFLARE]: [
		{ key: 'apiToken', label: 'API Token', hint: '需要 Zone:DNS:Edit 权限' },
	],
};

const PROVIDER_LABELS = {
	[DnsProvider.CLOUDFLARE]: 'Cloudflare',
	[DnsProvider.UNKNOWN]: '未知',
};

export { DnsProvider, NS_PATTERNS, PROVIDER_CREDENTIAL_FIELDS, PROVIDER_LABELS };
