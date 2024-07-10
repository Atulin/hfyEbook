import Root = cheerio.Root;

export type Filters = string[] | Map<string, string[]> | string;

export interface Contents {
	title: string;
	src: string;
	id: string;
	dom: Root;
	filters: Filters;
}

export interface Spec {
	title: string;
	creator: string;
	filters: Filters;
	filename: string;
	output: string[];
	contents: Contents[];
	loaded: number;
}
