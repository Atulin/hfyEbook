import type { Params } from "../types/params.js";
import Cheerio = cheerio.Cheerio;
import { purge } from "../lib/Cleaners.js";
import type { FilterModule } from "../types/filter.js";

export default {
	apply(params: Params, next: () => void) {
		const $ = params.chap.dom;
		const hrs = $("hr");

		if (hrs.length) {
			let pa: Cheerio | null = null;
			let len = 2500;

			if (params.chap["no-preamble-treshold"] !== undefined) {
				len = params.chap["no-preamble-treshold"];
			} else if (params.spec["no-preamble-treshold"] !== undefined) {
				len = params.spec["no-preamble-treshold"];
			}

			hrs.each((_, e) => {
				const c = $(e).prevAll();

				if (c.text().length <= len) {
					pa = c;
				}
			});

			if (!pa) {
				next();
				return;
			}

			const rem: Cheerio[] = [];

			// BUG: What the fuck?
			for (let i = 0; i < pa.length; i++) {
				rem.push($(pa[i]));
			}

			purge(rem);
		}

		next();
	},
} satisfies FilterModule as FilterModule;
