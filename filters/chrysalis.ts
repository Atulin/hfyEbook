import * as utils from "../lib/CheerioUtils.js";
import type { Params } from "../types/params.js";
import Cheerio = cheerio.Cheerio;
import { purge } from "../lib/Cleaners.js";
import type { FilterModule } from "../types/filter.js";

export default {
	apply(params: Params, next: () => void) {
		const chap = params.chap;
		const rem: Cheerio[] = [];

		utils.pruneParagraphs(chap, rem, {
			"Chapter 1": [0, 7],
			"Chapter 2": [3, 5],
			"Chapter 3": [3, 4],
			"Chapter 4": [3, 5],
			"Chapter 5": [4, 4],
			"Chapter 6": [4, 5],
			"Chapter 7": [4, 4],
			"Chapter 8": [4, 4],
			"Chapter 9": [4, 4],
			"Chapter 10": [4, 4],
			"Chapter 11": [4, 4],
			"Chapter 12": [4, 4],
			"Chapter 13": [4, 4],
			"Chapter 14": [4, 11],
			"Chapter 15": [4, 4],
			"Chapter 16": [4, 4],
		});

		purge(rem);
		next();
	},
} satisfies FilterModule as FilterModule;
