import type { Contents, Spec } from "./spec.js";
import Cheerio = cheerio.Cheerio;

export interface Params {
	spec: Spec;
	chap: Contents;
	unescape_html: (html: string) => string;
	decode_crs: (s: string) => string;
	purge: (set: Cheerio[]) => void;
	uri_cache: { cache: string[] };
	cheerio_flags: { decodeEntities: boolean };
}
