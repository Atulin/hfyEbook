import * as utils from "../lib/CheerioUtils.js";
import type { Params } from "../types/params.js";
import Cheerio = cheerio.Cheerio;
import { purge } from "../lib/Cleaners.js";
import type { FilterModule } from "../types/filter.js";

export default {
	apply(params: Params, next: () => void) {
		const $ = params.chap.dom;
		const rem: Cheerio[] = [];

		utils.removeFirst($, rem, "p", 3);

		$("li p").each((i, e) => {
			const el = $(e);

			el.parent().append(el.contents());
			el.remove();
		});

		purge(rem);
		next();
	},
} satisfies FilterModule as FilterModule;
