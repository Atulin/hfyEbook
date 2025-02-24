import * as utils from "../lib/CheerioUtils.js";
import type { Params } from "../types/params.js";
import Cheerio = cheerio.Cheerio;
import { purge } from "../lib/Cleaners.js";
import type { FilterModule } from "../types/filter.js";

export default {
	apply(params: Params, next: () => void) {
		const chap = params.chap;
		const $ = chap.dom;
		const rem: Cheerio[] = [];

		utils.removeMatching($, rem, "p", /^continued in (the )*comments/gi);

		if (
			[
				"Help I Accidentally the Princess",
				"How I Kept Him From Making the Big Orc Cry",
			].includes(chap.title)
		) {
			utils.removeLast($, rem, "p", 1);
		}

		purge(rem);
		next();
	},
} satisfies FilterModule as FilterModule;
