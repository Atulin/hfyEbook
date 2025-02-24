import type { Params } from "../types/params.js";
import Cheerio = cheerio.Cheerio;
import { purge } from "../lib/Cleaners.js";
import Root = cheerio.Root;
import Element = cheerio.Element;

function processText($: Root, fn: (c: Element) => void) {
	$("p").each((_, e) => {
		const cont = $(e).contents();

		for (let i = 0; i < cont.length; i++) {
			const c = cont[i];

			if (c.type === "text") {
				fn(c);
			}
		}
	});
}

export function apply(params: Params, next: () => void) {
	const chap = params.chap;
	const $ = chap.dom;

	if (chap.title === "Dark Heart") {
		processText($, (c: Element) => {
			if (c.data?.charCodeAt(0) === 0x2003) {
				c.data = c.data?.slice(2, c.data?.length);
			}
		});
	} else if (["Positions of Power", "Prisoners", "Center of attention"].includes(chap.title)) {
		processText($, (c) => {
			if (c.data && c.data?.indexOf("*") > -1) {
				c.data = c.data?.replace(/\*/, "");
			}
		});
	}

	const rem: Cheerio[] = [];
	const ps = $("p");
	const prune_chapter = [
		"The Fittest",
		"The Rabbit Hole",
		"Solve for X-plosion",
		"Going Without",
		"Lost Futures",
	].includes(chap.title);

	if (prune_chapter) {
		for (let i = 0; i < 2; i++) {
			rem.push($(ps[i]));
		}
	}

	const fp = $(ps[ps.length - 1]);

	if (
		fp.text() === "END OF CHAPTER" ||
		fp.text() === "End of Chapter" ||
		fp.text() === "Chapter End"
	) {
		rem.push(fp);
	}

	purge(rem);
	next();
}
