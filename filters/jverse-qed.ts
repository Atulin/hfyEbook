import type { Params } from "../types/params.js";
import * as utils from "./utils.js";
import Cheerio = cheerio.Cheerio;

export function apply(params: Params, next: () => void) {
	const $ = params.chap.dom;
	const rem: Cheerio[] = [];

	utils.removeFirst($, rem, "p", 3);

	$("li p").each((i, e) => {
		const el = $(e);

		el.parent().append(el.contents());
		el.remove();
	});

	params.purge(rem);
	next();
}
