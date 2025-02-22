import Cheerio = cheerio.Cheerio;
import type { Params } from "../types/params.js";

export function apply(params: Params, next: () => void) {
	const chap = params.chap;
	const $ = chap.dom;
	const rem: Cheerio[] = [];

	// Remove chapter links
	$("p a").each((i, e) => {
		const el = $(e);

		if (["next chapter", "continued"].includes(el.text()?.toLowerCase())) {
			rem.push(el);
		}

		if (el.prev().is("hr")) {
			rem.push($(el.prev()));
		}
	});

	params.purge(rem);
	next();
}
