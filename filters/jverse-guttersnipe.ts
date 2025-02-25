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

		const wsre = /^[   ]*/g;
		const qtre = /”+/g;
		const spre = /“ +/g;

		$("h2").each((i, e) => {
			const nxt = $(e).next();

			if (nxt.length && nxt[0] === "hr") {
				rem.push($(nxt));
			}

			e.name = "strong";

			const el = $(e);

			el.append("<br/>");

			const f = el.contents()[0];

			if (f.type === "text") {
				f.data = f.data?.replace(wsre, "");
			}

			const txt = el.text();

			if (["Previous Chapter", "Next Chapter"].includes(txt)) {
				rem.push(el);
			}
		});

		$("p").each((i, e) => {
			const cont = $(e).contents();

			for (let idx = 0; idx < cont.length; idx++) {
				const c = cont[idx];

				if (c.type === "text") {
					c.data = c.data?.replace(wsre, "").replace(qtre, "”").replace(spre, "“");
				}
			}
		});

		utils.pruneParagraphs(chap, rem, {
			"Part 1": [2, 0],
			"Part 2": [2, 0, ['strong:contains("Continued in comments")']],
			"Part 3": [1, 0],
			"Part 4": [2, 0],
			"Part 5": [2, 0],
			"Part 6": [2, 1],
			"Part 7": [2, 0],
			"Part 8": [3, 0],
			"Part 9": [4, 0],
		});

		if (chap.title === "Part 4") {
			$('*:contains("Davi was scrambling through the vent")')[0].name = "p";
		} else if (chap.title === "Part 7") {
			$('*:contains("Bobi, for his part, agreed.")')[0].name = "p";
		}

		$("strong").each((i, e) => {
			const el = $(e);
			const p = $($.parseHTML("<p></p>"));

			el.replaceWith(p);
			p.before("<hr/>");
			p.append(el);
		});

		$('p:contains("+++++")').replaceWith("<hr/>");

		purge(rem);

		$("*")
			.contents()
			.each((i, e) => {
				if (e.type !== "text") {
					return;
				}

				e.data = e.data?.replace(/&#xA0;/gi, "");
			});

		next();
	},
} satisfies FilterModule as FilterModule;
