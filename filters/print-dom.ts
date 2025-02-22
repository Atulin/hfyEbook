import Root = cheerio.Root;
import type { Params } from "../types/params.js";
import Cheerio = cheerio.Cheerio;

function filter_txt(txt: string) {
	return txt.replace(/\n/g, "\\n");
}

function display($: Root, indent: string, root: Cheerio) {
	const cont = root.contents();

	for (let i = 0; i < cont.length; i++) {
		const c = cont[i];

		if (c.type === "tag") {
			console.log(`${indent}<${c.name}>`);
			display($, `${indent}    `, $(c));
			console.log(`${indent}</${c.name}>`);
		} else if (c.type === "text") {
			console.log(`${indent}[${c.data && c.data?.length < 40 ? filter_txt(c.data) : "..."}]`);
		} else {
			console.log(`${indent}[${c.type.toUpperCase()}]`);
		}
	}
}

export function apply(params: Params, next: () => void) {
	const $ = params.chap.dom;

	display($, "", $.root());
	next();
}
