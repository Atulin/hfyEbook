import Cheerio = cheerio.Cheerio;
import { purge } from "../lib/Cleaners.js";
import type { Params } from "../types/params.js";

export function apply(params: Params, next: () => void) {
	const chap = params.chap;
	const $ = chap.dom;
	const rem: Cheerio[] = [];

	// Remove chapter links
	$("p a").each((i, e) => {
		const el = $(e);

		if (
			el.text() === "Previous" ||
			el.text() === "Next" ||
			el.text().indexOf("Chapter") === 0
		) {
			rem.push(el);
		}

		if (el.prev().is("hr")) {
			rem.push($(el.prev()));
		}
	});

	// Remove chapter headings
	$("p").each((_, e) => {
		const el = $(e);

		if (el.text()[0] === "#") {
			rem.push(el);
		}
	});

	purge(rem);
	next();
}
