export function norm(s: string): string {
	return s.trim().toLowerCase();
}

export function normKey(s: string): string {
	return norm(s).replace(/_/g, ' ');
}

export function toStrList(value: unknown): string[] {
	if (value == null) return [];
	if (Array.isArray(value)) return value.map((x) => norm(String(x))).filter(Boolean);
	if (typeof value === 'string') {
		const t = value.trim();
		if (t.startsWith('[')) {
			try {
				const parsed = JSON.parse(t) as unknown;
				if (Array.isArray(parsed)) {
					return parsed.map((x) => norm(String(x))).filter(Boolean);
				}
			} catch {
				/* użyj split */
			}
		}
		return t
			.split(',')
			.map((x) => norm(x))
			.filter(Boolean);
	}
	return [norm(String(value))];
}

export function yearFromUnknown(value: unknown): number | undefined {
	if (value == null) return undefined;
	if (typeof value === 'number' && !Number.isNaN(value)) return value;
	const s = String(value).trim();
	const y = parseInt(s.slice(0, 4), 10);
	if (!Number.isNaN(y) && y >= 1900 && y <= 2100) return y;
	return undefined;
}

export function yearFromDateField(value: unknown): number | undefined {
	if (value == null) return undefined;
	const s = String(value).trim();
	if (/^(19|20)\d{2}-\d{2}-\d{2}/.test(s)) return parseInt(s.slice(0, 4), 10);
	return yearFromUnknown(value);
}

function ongoingEndDate(value: unknown): boolean {
	const s = norm(String(value ?? ''));
	return s === 'today' || s === 'present' || s === 'ongoing' || s === '';
}

export function matchesProject(
	data: Record<string, unknown>,
	filters: {
		category?: string;
		tech?: string[];
		status?: string;
		year?: number;
		role?: string;
		matchAll?: boolean;
	}
): boolean {
	const checks: boolean[] = [];
	const catRaw = String(data.project_category ?? data.category ?? '');
	const cat = normKey(catRaw);
	const techs = toStrList(data.tech_stack ?? data.tech ?? data.tags);
	const st = norm(String(data.status ?? ''));
	const yr = yearFromUnknown(data.year);
	const rl = norm(String(data.role ?? ''));

	if (filters.category) {
		const want = normKey(filters.category);
		checks.push(cat === want || cat.includes(want) || want.includes(cat));
	}
	if (filters.tech?.length) {
		const want = filters.tech.map((t) => norm(t));
		if (filters.matchAll) {
			checks.push(want.every((t) => techs.some((h) => h === t || h.includes(t) || t.includes(h))));
		} else {
			checks.push(want.some((t) => techs.some((h) => h === t || h.includes(t) || t.includes(h))));
		}
	}
	if (filters.status) checks.push(st === norm(filters.status));
	if (filters.year != null) checks.push(yr === filters.year);
	if (filters.role) {
		const want = norm(filters.role);
		checks.push(rl === want || rl.includes(want));
	}

	return checks.length === 0 || checks.every(Boolean);
}

export function matchesSkill(
	data: Record<string, unknown>,
	filters: { tags?: string[]; category?: string; level?: string; type?: string; matchAll?: boolean }
): boolean {
	const checks: boolean[] = [];
	const tagList = toStrList(data.tags);
	const cat = normKey(String(data.category ?? ''));
	const lvl = norm(String(data.level ?? ''));
	const typ = norm(String(data.type ?? ''));

	if (filters.category) {
		const want = normKey(filters.category);
		checks.push(cat === want || cat.includes(want));
	}
	if (filters.level) checks.push(lvl === norm(filters.level));
	if (filters.type) checks.push(typ === norm(filters.type));
	if (filters.tags?.length) {
		const want = filters.tags.map((t) => norm(t));
		if (filters.matchAll) {
			checks.push(want.every((t) => tagList.some((h) => h === t || h.includes(t) || t.includes(h))));
		} else {
			checks.push(want.some((t) => tagList.some((h) => h === t || h.includes(t) || t.includes(h))));
		}
	}

	return checks.length === 0 || checks.every(Boolean);
}

export function matchesExperience(
	data: Record<string, unknown>,
	filters: {
		company?: string;
		role?: string;
		tech?: string[];
		startYear?: number;
		endYear?: number;
	}
): boolean {
	const checks: boolean[] = [];
	const company = norm(String(data.company ?? ''));
	const role = norm(String(data.role ?? ''));
	const techs = toStrList(data.tech);
	const startY = yearFromDateField(data.startDate);
	const endY = ongoingEndDate(data.endDate) ? undefined : yearFromDateField(data.endDate);

	if (filters.company) {
		const w = norm(filters.company);
		checks.push(company === w || company.includes(w));
	}
	if (filters.role) {
		const w = norm(filters.role);
		checks.push(role === w || role.includes(w));
	}
	if (filters.tech?.length) {
		const want = filters.tech.map((t) => norm(t));
		checks.push(want.some((t) => techs.some((h) => h === t || h.includes(t) || t.includes(h))));
	}
	if (filters.startYear != null) {
		checks.push(startY !== undefined && startY === filters.startYear);
	}
	if (filters.endYear != null) {
		checks.push(endY !== undefined && endY === filters.endYear);
	}

	return checks.length === 0 || checks.every(Boolean);
}

export function matchesCourse(
	data: Record<string, unknown>,
	filters: {
		category?: string;
		platform?: string;
		year?: number;
		status?: string;
		tags?: string[];
		matchAll?: boolean;
	}
): boolean {
	const checks: boolean[] = [];
	const cat = normKey(String(data.category ?? ''));
	const plat = norm(String(data.platform ?? ''));
	const yr = yearFromUnknown(data.year);
	const st = norm(String(data.status ?? ''));
	const tagList = toStrList(data.tags);

	if (filters.category) {
		const want = normKey(filters.category);
		checks.push(cat === want || cat.includes(want));
	}
	if (filters.platform) {
		const want = norm(filters.platform);
		checks.push(plat === want || plat.includes(want));
	}
	if (filters.year != null) checks.push(yr === filters.year);
	if (filters.status) checks.push(st === norm(filters.status));
	if (filters.tags?.length) {
		const want = filters.tags.map((t) => norm(t));
		if (filters.matchAll) {
			checks.push(want.every((t) => tagList.some((h) => h === t || h.includes(t) || t.includes(h))));
		} else {
			checks.push(want.some((t) => tagList.some((h) => h === t || h.includes(t) || t.includes(h))));
		}
	}

	return checks.length === 0 || checks.every(Boolean);
}

export function uniqueSorted(values: Iterable<string>): string[] {
	return [...new Set([...values].map((v) => v.trim()).filter(Boolean))].sort((a, b) =>
		a.localeCompare(b, 'en')
	);
}
