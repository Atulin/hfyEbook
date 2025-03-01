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

			if (params.chap["no-preamble-threshold"] !== undefined) {
				len = params.chap["no-preamble-threshold"];
			} else if (params.spec["no-preamble-threshold"] !== undefined) {
				len = params.spec["no-preamble-threshold"];
			}

			for (const elem of hrs) {
				const c = $(elem).prevAll();

				if (c.text().length <= len) {
					pa = c;
				}
			}

			if (pa === null) {
				next();
				return;
			}

			const rem: Cheerio[] = [];

			for (let i = 0; i < pa.length; i++) {
				rem.push($(pa[i]));
			}

			purge(rem);
		}

		next();
	},
} satisfies FilterModule as FilterModule;
