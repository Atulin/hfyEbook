import type { Params } from "../types/params.js";
import * as utils from "./utils.js";
import Cheerio = cheerio.Cheerio;
import { purge } from "../lib/Cleaners.js";

function apply(params: Params, next: () => void) {
	const chap = params.chap;
	const $ = chap.dom;
	const rem: Cheerio[] = [];

	if (chap.title === "Part 1") {
		utils.removeLast($, rem, "p", 1);
	} else if (chap.title === "Part 3" || chap.title === "Part 20") {
		utils.removeFirst($, rem, "p", 3);
	} else if (["Part 6", "Part 18", "Part 22"].includes(chap.title)) {
		utils.removeFirst($, rem, "p", 2);
	} else {
		utils.removeFirst($, rem, "p", 1);
	}

	purge(rem);
	next();
}
