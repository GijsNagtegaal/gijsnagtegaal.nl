export type AssetValue = string | { id?: string; memoji?: string } | null | undefined;

export interface PortfolioProject {
	slug: string;
	type_site?: string;
	Opdrachtgever?: string;
	opdracht?: string;
	description?: string;
	tags?: string[];
	image?: string;
	image_dark?: string;
}

export interface TechStackItem {
	name: string;
	image: string;
	image_dark: string;
}