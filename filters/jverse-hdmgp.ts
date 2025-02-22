import Cheerio = cheerio.Cheerio;
import type { Params } from "../types/params.js";

export function apply(params: Params, next: () => void) {
	const chap = params.chap;
	const $ = chap.dom;
	const rem: Cheerio[] = [];

	if (chap.title.slice(chap.title.length - 2, chap.title.length) === " 7") {
		const ps = $("p");

		rem.push($(ps[0]));
		rem.push($(ps[1]));
	}

	rem.push($("#-"));
	rem.push($("#continued-in-part-2-http-redd-it-2ydy99-"));

	// Remove next / prev chapter link paragraphs and author post-ambles.
	// Also gets rid of inexplicable empty paragraphs.
	$("p").each((i, e) => {
		const el = $(e);

		if (el.find("a").length || el.contents().length < 1) {
			rem.push(el);
		}
	});

	// Remove 'All chapter' references
	$("p span").each((i, e) => {
		const el = $(e);

		if (el.text() === "All chapters") {
			rem.push(el.parent());
		}
	});

	$("h2").each((i, e) => {
		e.name = "p";
		e.attribs.id = undefined;
	});

	const pa = $("hr").last().nextAll();
	const html = $.html(pa);

	if (html.length < 500) {
		for (let i = 0; i < pa.length; i++) {
			rem.push($(pa[i]));
		}
	}

	params.purge(rem);
	next();
}
