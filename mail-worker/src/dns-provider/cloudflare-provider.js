const CF_API = 'https://api.cloudflare.com/client/v4';
const WORKER_NAME = 'cloud-mail';

const cloudflareProvider = {
	async configureRecords(apiToken, domain, verifyToken) {
		const zoneId = await this._findZoneId(apiToken, domain);

		const records = [
			{ type: 'MX', name: domain, content: 'route1.mx.cloudflare.net', priority: 10, proxied: false },
			{ type: 'MX', name: `*.${domain}`, content: 'route1.mx.cloudflare.net', priority: 10, proxied: false },
			{ type: 'CNAME', name: `mail.${domain}`, content: 'route1.mx.cloudflare.net', proxied: false },
			{ type: 'TXT', name: `_cloudmail-verify.${domain}`, content: verifyToken, proxied: false },
		];

		const results = [];
		for (const record of records) {
			try {
				const r = await this._createRecord(apiToken, zoneId, record);
				results.push({ type: record.type, name: record.name, ...r });
			} catch (e) {
				results.push({ type: record.type, name: record.name, success: false, message: e.message });
			}
		}

		// 启用 Email Routing 并设置 catch-all 转发到 Worker
		try {
			await this._enableEmailRouting(apiToken, zoneId);
			await this._setCatchAllToWorker(apiToken, zoneId);
			results.push({ type: 'EmailRouting', name: 'catch-all', success: true });
		} catch (e) {
			results.push({ type: 'EmailRouting', name: 'catch-all', success: false, message: e.message });
		}

		return results;
	},

	async _enableEmailRouting(apiToken, zoneId) {
		const current = await this._getEmailRouting(apiToken, zoneId);
		if (current?.enabled || current?.status === 'ready') return;

		const res = await fetch(`${CF_API}/zones/${zoneId}/email/routing/enable`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
		});
		const data = await res.json();
		if (data.success) return;

		const msg = [
			...(data.errors || []).map(e => e.message || ''),
			...(data.messages || []).map(m => typeof m === 'string' ? m : m.message || ''),
		].join(' ').toLowerCase();
		if (msg.includes('already') || msg.includes('enabled')) return;

		throw new Error(data.errors?.[0]?.message || 'Failed to enable email routing');
	},

	async _getEmailRouting(apiToken, zoneId) {
		const res = await fetch(`${CF_API}/zones/${zoneId}/email/routing`, {
			headers: { Authorization: `Bearer ${apiToken}` },
		});
		const data = await res.json();
		if (!data.success) return null;
		return data.result;
	},

	async _setCatchAllToWorker(apiToken, zoneId) {
		const res = await fetch(`${CF_API}/zones/${zoneId}/email/routing/rules/catch_all`, {
			method: 'PUT',
			headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				matchers: [{ type: 'all' }],
				actions: [{ type: 'worker', value: [WORKER_NAME] }],
				enabled: true,
				name: 'No3realms-Mail catch-all',
			}),
		});
		const data = await res.json();
		if (data.success) return;

		const msg = data.errors?.[0]?.message || 'Failed to set catch-all rule';
		if (msg.toLowerCase().includes('already')) return;
		throw new Error(msg);
	},

	async _findZoneId(apiToken, domain) {
		const res = await fetch(`${CF_API}/zones?name=${encodeURIComponent(domain)}&status=active`, {
			headers: { Authorization: `Bearer ${apiToken}` },
		});
		const data = await res.json();
		if (!data.success || !data.result?.length) {
			throw new Error('ZONE_NOT_FOUND');
		}
		return data.result[0].id;
	},

	async _createRecord(apiToken, zoneId, record) {
		const res = await fetch(`${CF_API}/zones/${zoneId}/dns_records`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(record),
		});
		const data = await res.json();
		if (!data.success) {
			const code = data.errors?.[0]?.code;
			const msg = data.errors?.[0]?.message || 'Unknown error';
			if (code === 81057 || msg.includes('already exists')) {
				return { success: true, alreadyExists: true };
			}
			throw new Error(msg);
		}
		return { success: true, alreadyExists: false };
	},
};

export default cloudflareProvider;
