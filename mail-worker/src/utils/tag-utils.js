export function normalizeTags(input) {
	const source = Array.isArray(input)
		? input
		: String(input || '').split(/[,，\n]/);

	return [...new Set(source
		.map(tag => String(tag || '').trim())
		.filter(Boolean))]
		.slice(0, 20);
}

export function tagsToArray(value) {
	if (Array.isArray(value)) {
		return normalizeTags(value);
	}

	if (!value) {
		return [];
	}

	try {
		return normalizeTags(JSON.parse(value));
	} catch {
		return [];
	}
}

export function tagsToString(value) {
	return JSON.stringify(normalizeTags(value));
}

export function tagsQueryMatch(tags, query) {
	const keyword = String(query || '').trim();
	if (!keyword) {
		return true;
	}

	return tagsToArray(tags).some(tag => tag.includes(keyword));
}
