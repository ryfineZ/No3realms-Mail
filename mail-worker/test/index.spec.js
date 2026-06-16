import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';

describe('No3realms-Mail worker', () => {
	it('serves the app shell (unit style)', async () => {
		const request = new Request('http://example.com');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(await response.text()).toContain('<div id="app"></div>');
	});

	it('serves the app shell (integration style)', async () => {
		const response = await SELF.fetch('http://example.com');
		expect(response.status).toBe(200);
		expect(await response.text()).toContain('<div id="app"></div>');
	});

	it('serves share page metadata without old product name', async () => {
		const response = await SELF.fetch('http://example.com/share/test-share?email=test%40example.com', {
			headers: { Accept: 'text/html' },
		});
		const html = await response.text();

		expect(response.status).toBe(200);
		expect(html).toContain('<title>test@example.com 的只读邮箱分享</title>');
		expect(html).toContain('<meta property="og:title" content="test@example.com 的只读邮箱分享">');
		expect(html).not.toContain('Cloud Mail');
	});
});
