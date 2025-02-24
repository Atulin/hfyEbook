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

		utils.removeMatching($, rem, "p strong", /^translator note:/i);
		utils.removeMatching($, rem, "p", /^continued in comments/i);

		const rem_last_p = [
			"Stranger",
			"Hand of War",
			"Quest",
			"Retribution",
			"Fireproof",
			"Greetings",
			"The Feast",
			"Undone",
			"Susan",
			"Lost Tales",
		];

		const ps = $("p");
		const lp = $(ps[ps.length - 1]);

		if (rem_last_p.includes(chap.title) || lp.find("a").length) {
			rem.push(lp);
		}

		if (chap.title === "Retribution") {
			rem.push($(ps[ps.length - 2]));
		} else if (chap.title === "Greetings") {
			rem.push($(ps[ps.length - 2]));
			rem.push($(ps[ps.length - 3]));
		}

		purge(rem);
		next();
	},
} satisfies FilterModule as FilterModule;
