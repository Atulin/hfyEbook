import type { FilterModule } from "../types/filter.js";
import type { Params } from "../types/params.js";

export default {
	apply(params: Params, next: () => void) {
		const $ = params.chap.dom;
		const break_test = /[^\+\n .]/;

		// Deathworlders, Salvage: <p>[^\+.]</p> -> <hr/>
		$("p").each((i, e) => {
			const el = $(e);
			const txt = el.text();

			if (txt !== "" && !break_test.test(txt)) {
				e.name = "hr";
				e.children = [];
			}
		});

		next();
	},
} satisfies FilterModule as FilterModule;
