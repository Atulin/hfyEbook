import Cheerio = cheerio.Cheerio;
import { purge } from "../lib/Cleaners.js";
import type { FilterModule } from "../types/filter.js";
import type { Params } from "../types/params.js";

export default {
	apply(params: Params, next: () => void) {
		const chap = params.chap;
		const $ = chap.dom;
		const ps = $("p");
		const rem: Cheerio[] = [];

		if (chap.title === "Monkeys Reaches Stars") {
			ps.each((_, e) => {
				const p = $(e);

				if (p.text() === "&amp;nbsp") {
					rem.push(p);
				}
			});
		}

		const lp = $(ps[ps.length - 1]);

		if (lp.text().match(/^Part \w+$/)) {
			rem.push(lp);
		}

		purge(rem);
		next();
	},
} satisfies FilterModule as FilterModule;
