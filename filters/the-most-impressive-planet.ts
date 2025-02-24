import Cheerio = cheerio.Cheerio;
import { purge } from "../lib/Cleaners.js";
import type { FilterModule } from "../types/filter.js";
import type { Params } from "../types/params.js";

export default {
	apply(params: Params, next: () => void) {
		const chap = params.chap;
		const $ = chap.dom;
		const rem: Cheerio[] = [];

		// Remove chapter links
		$("p a").each((i, e) => {
			const el = $(e);

			if (["next chapter", "continued"].includes(el.text()?.toLowerCase())) {
				rem.push(el);
			}

			if (el.prev().is("hr")) {
				rem.push($(el.prev()));
			}
		});

		purge(rem);
		next();
	},
} satisfies FilterModule as FilterModule;
