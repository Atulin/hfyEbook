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

		utils.pruneParagraphs(chap, rem, {
			// Peace
			"Humanity: Builders in the Void": [0, 8],
			Nischal: [3, 4],
			"The greatest invasion of all time": [1, 0],
			Aww: [1, 1],
			"The New Kid": [2, 0],
			"Red Cross": [2, 2],
			"Yuri and Stel": [3, 0],
			Falling: [4, 0],
			Longmaraíodh: [0, 4],
			"An Old Tale": [1, 2],
			"Shoulders of Giants": [0, 2],
			"The Slow Chase": [0, 1],
			// War
			"The Hammer Falls": [1, 1],
			"Inner Demons": [3, 0],
			"Logistical Nightmare": [3, 0],
			"The Fix": [2, 0],
			Masters: [3, 0],
			"Stranglehold, Part 1": [3, 0],
			"Stranglehold, Part 2": [3, 1],
			"Stranglehold, Part 3": [4, 0],
			"Stranglehold, Part 4": [5, 1],
			"Stranglehold, Part 5": [6, 0],
			Escape: [3, 1],
			"Flight in the Void": [0, 2],
			Remembrance: [0, 4],
			"The Wolves": [0, 5],
			"The Generals life": [0, 1],
		});

		if (chap.title === "An Old Tale") {
			utils.removeAll($, rem, "h2");
		}

		purge(rem);
		next();
	},
} satisfies FilterModule as FilterModule;
