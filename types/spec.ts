import Root = cheerio.Root;

export type Filters = string[] | { [key: string]: string[] } | string;

export interface Contents {
	byline: string | undefined;
	title: string;
	src: string;
	id: string;
	dom: Root;
	filters: Filters;
	"no-preamble-treshold": number | undefined;
	"sw-part-index": number | undefined;
}

export interface Spec {
	patreon: string | undefined;
	title: string;
	creator: string;
	filters: Filters;
	filename: string;
	output: string[];
	contents: Contents[];
	loaded: number;
	"no-preamble-treshold": number | undefined;
}
