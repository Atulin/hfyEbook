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

		utils.removeAll($, rem, "h2");

		if (chap.title === "The Locals") {
			utils.removeFirst($, rem, "p", 2);
			utils.removeSingle($, rem, 'p:contains("CONTINUED IN COMMENTS BELOW")');
			utils.removeSingle($, rem, 'p:contains("I felt like adding more. Have an epilogue!")');
			utils.removeAll($, rem, "h1");
		}

		utils.pruneParagraphs(chap, rem, {
			"Saturday Morning Breakfast": [2, 1],
			"The Champions Pt II: Tidying Up": [0, 1],
			"Good Training: Pecking Order": [5, 0],
			"Good Training: April Fool's": [2, 0],
		});

		if (rem.length) {
			purge(rem);
		}

		next();
	},
} satisfies FilterModule as FilterModule;
