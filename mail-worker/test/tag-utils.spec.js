import { describe, it, expect } from 'vitest';
import { normalizeTags, tagsToArray, tagsQueryMatch } from '../src/utils/tag-utils';

describe('tag utils', () => {
	it('normalizes tags from mixed input', () => {
		expect(normalizeTags(['  工作 ', '邮件', '', '工作'])).toEqual(['工作', '邮件']);
		expect(normalizeTags('工作, 邮件，测试')).toEqual(['工作', '邮件', '测试']);
	});

	it('parses stored tags safely', () => {
		expect(tagsToArray('["工作","项目"]')).toEqual(['工作', '项目']);
		expect(tagsToArray('')).toEqual([]);
		expect(tagsToArray('not-json')).toEqual([]);
	});

	it('matches tag queries by substring', () => {
		expect(tagsQueryMatch(['项目A', '临时'], '项目')).toBe(true);
		expect(tagsQueryMatch(['项目A', '临时'], '不存在')).toBe(false);
	});
});
