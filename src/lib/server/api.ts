import type { AssetValue, PortfolioProject, TechStackItem } from '$lib/types';

const API_BASE = 'https://api.gijsnagtegaal.nl/items';
const ASSET_BASE = 'https://api.gijsnagtegaal.nl/assets';
const PLACEHOLDER_IMAGE = '/assets/images/gijsmemo.webp';

export function assetUrl(asset: AssetValue): string {
	if (!asset) return PLACEHOLDER_IMAGE;

	const id = typeof asset === 'object' ? asset.id ?? asset.memoji : asset;
	return typeof id === 'string' && id ? `${ASSET_BASE}/${id}` : PLACEHOLDER_IMAGE;
}

async function fetchData<T>(endpoint: string, fetcher: typeof fetch): Promise<T | null> {
	try {
		const response = await fetcher(`${API_BASE}/${endpoint}`);
		if (!response.ok) return null;
		const result = (await response.json()) as { data?: T };
		return result.data ?? null;
	} catch (error) {
		console.error(`Fetch error for ${endpoint}:`, error);
		return null;
	}
}

export function processItems<T extends Record<string, unknown>>(items: T | T[] | null): Array<T & { image: string; image_dark: string }> {
	const array = items ? (Array.isArray(items) ? items : [items]) : [];
	return array.map((item) => ({
		...item,
		image: assetUrl(item.image as AssetValue),
		image_dark: assetUrl(item.image_dark as AssetValue)
	}));
}

export async function getPortfolio(fetcher: typeof fetch): Promise<PortfolioProject[]> {
	const items = await fetchData<Record<string, unknown>[]>('portfolio_items', fetcher);
	return processItems(items) as unknown as PortfolioProject[];
}

export async function getTechStack(fetcher: typeof fetch): Promise<TechStackItem[]> {
	const items = await fetchData<Record<string, unknown>[]>('tech_stack', fetcher);
	return processItems(items) as unknown as TechStackItem[];
}

export async function getProject(slug: string, fetcher: typeof fetch): Promise<PortfolioProject | null> {
	const items = await fetchData<Record<string, unknown>[]>(`portfolio_items?filter[slug][_eq]=${encodeURIComponent(slug)}`, fetcher);
	return (processItems(items)[0] as unknown as PortfolioProject | undefined) ?? null;
}