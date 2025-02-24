import type { Params } from "../types/params.js";
import * as utils from "./utils.js";
import Cheerio = cheerio.Cheerio;
import { purge } from "../lib/Cleaners.js";

export function apply(params: Params, next: () => void) {
	const $ = params.chap.dom;
	const rem: Cheerio[] = [];

	utils.removeFirst($, rem, "p", 3);

	$("li p").each((i, e) => {
		const el = $(e);

		el.parent().append(el.contents());
		el.remove();
	});

	purge(rem);
	next();
}
