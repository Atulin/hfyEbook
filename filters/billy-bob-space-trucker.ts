import * as utils from "../lib/CheerioUtils.js";
import type { Params } from "../types/params.js";
import Cheerio = cheerio.Cheerio;
import { purge } from "../lib/Cleaners.js";
import type { FilterModule } from "../types/filter.js";

export default {
	apply(params: Params, next: () => void) {
		const chap = params.chap;
		const $ = chap.dom;
		const c_re = /^ *Chapitre [a-z,A-Z,-]*\.*\n*/g;
		const rem: Cheerio[] = [];

		// Remove spurious chapter headings without removing body text that may
		// share an enclosing paragraph with the heading.
		$("p").each((i, e) => {
			const cont = $(e).contents();

			for (let i = 0; i < cont.length; i++) {
				const c = cont[i];

				if (c.type === "text" && c?.data && c.data.search(c_re) > -1) {
					c.data = c.data.replace(c_re, "");
				}
			}
		});

		// Harmonize catchphrase formatting.
		if (["Un", "Deux"].includes(chap.title)) {
			$("pre").replaceWith($("<p><strong>Billy-Bob Space Trucker</strong></p>\n"));
		} else if (chap.title === "Trois") {
			$.root().find("p strong").text("Billy-Bob Space Trucker");
		} else if (chap.title === "Dix-Sept") {
			utils.removeSingle($, rem, 'p:contains("Edit I hates they spelling yarr")');
		} else if (chap.title === "Dix-Huit") {
			utils.removeSingle($, rem, 'p:contains("Edit fix: Got overzealous with copy paste")');
			utils.removeSingle($, rem, 'p:contains("Edit. Thought and FLT")');
		} else if (chap.title === "Falling from on high") {
			const fp = $("p").first();

			fp.text(fp.text().replace(/Falling from on high\n/, ""));
		}

		// Filter various pre- and postamble paragraphs.
		utils.pruneParagraphs(chap, rem, {
			"Dix-Sept": [0, 1],
			"Dix-Neuf": [0, 1],
			"Vingt-Et-Un": [1, 0],
			"Vingt-Deux": [1, 0],
			"Vingt-Six": [0, 1],
			"Vingt-Sept": [4, 1],
			"Trente-Cinq première partie": [0, 1],
			"Trente-Cinq deuxième partie": [1, 0],
		});

		purge(rem);
		next();
	},
} satisfies FilterModule as FilterModule;
