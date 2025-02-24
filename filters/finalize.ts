// The actions of other filters can leave the DOM in an undesirable state,
// this filter attempts to correct these anomalies before final output processing.

import { decodeCrs } from "../lib/Cleaners.js";
import type { FilterModule } from "../types/filter.js";
import type { Params } from "../types/params.js";

// It should always be used as the final stage.import type { FilterModule } from "../types/filter.js";

export default {
	apply(params: Params, next: () => void) {
		const $ = params.chap.dom;

		// Remove any empty paragraphs
		$("p").each((i, e) => {
			const p = $(e);

			if (p.contents().length === 1) {
				const cr = p.contents()[0];

				if (cr.type === "text" && cr.data) {
					if (decodeCrs(cr.data).trim() === "") {
						p.remove();
					}
				}
			}
		});

		// Removal of DOM elements tends to leave surrounding
		// newline text nodes, resulting in large gaps in the root.
		const newl = /^\n*$/;
		let roots = $.root().contents();
		let rem = true;

		for (let i = 0; i < roots.length; i++) {
			const r = roots[i];

			if (r.type === "text" && r.data && r.data.search(newl) > -1) {
				if (rem) {
					$(r).remove();
				}

				rem = true;
			} else {
				rem = false;
			}
		}

		// That may leave a single trailing newline
		roots = $.root().contents();

		const last = roots[roots.length - 1];

		if (last.type === "text" && last.data && last.data.search(newl) > -1) {
			$(last).remove();
		}

		next();
	},
} satisfies FilterModule as FilterModule;
