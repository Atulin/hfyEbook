import Root = cheerio.Root;
import type { Params } from "../types/params.js";
import Cheerio = cheerio.Cheerio;
import Element = cheerio.Element;

function removeComments($: Root, el: Cheerio) {
	$(el)
		.contents()
		.each((i, e) => {
			if (e.type === "comment") {
				$(e).remove();
			} else {
				removeComments($, e);
			}
		});
}

// The Reddit JSON API seems to have a general bug in its handling of entity
// encoding in 'code' and 'pre' tags, e.g. monospaced blocks.
function fixMonoEntities($: Root) {
	const pt = /&amp;(.*;)/g;
	const replaceAmps = (i: number, e: Element) => {
		const cont = $(e).contents();

		for (let i = 0; i < cont.length; i++) {
			const c = cont[i];

			if (c.type === "text") {
				while (pt.exec(c.data)) {
					c.data = c.data.replace(pt, "&$1");
				}
			}
		}
	};

	$("pre > code").each(replaceAmps);
	$("code > pre").each(replaceAmps);
}

export function apply(params: Params, next: () => void) {
	const $ = params.chap.dom;

	// Remove all comments
	removeComments($, $.root());

	// Remove all links that are not external
	$("a").each((i, e) => {
		const el = e as cheerio.TagElement;
		if (el.attribs?.href) {
			if (
				el.attribs.href.startsWith("http://www.reddit.com") ||
				el.attribs.href.startsWith("https://www.reddit.com")
			) {
				el.name = "span";
				el.attribs = {};
			}
		}
	});

	// Remove all classes and ids
	$("*").each((i, e) => {
		const el = e as cheerio.TagElement;
		if (el.attribs) {
			el.attribs.class = "";
			el.attribs.id = "";
		}
	});

	fixMonoEntities($);
	next();
}
