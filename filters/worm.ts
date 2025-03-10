import Root = cheerio.Root;
import type { FilterModule } from "../types/filter.js";
import type { Params } from "../types/params.js";

function filterText($: Root, e) {
	if (e.type === "tag") {
		const c = $(e).contents();

		for (let i = 0; i < c.length; i++) {
			filterText($, c[i]);
		}
	} else if (e.type === "text") {
		// This is less odd than it looks: The second space
		// is some weird Unicode character. Here, we're replacing
		// the byte sequence 0x20c2 -> 0x20. We don't want double space
		// after full stop.
		e.data = e.data.replace(/  /g, " ");
	}
}

export default {
	apply(params: Params, next: () => void) {
		const $ = params.chap.dom;
		const cont = $($(".entry-content")[0].children);

		$._root.children = [];
		$.root().append(cont);

		$("a").remove();
		$("ul").remove();
		$("div").remove();
		$("form").remove();
		$("label").remove();
		$("address").remove();
		$("img").remove();

		$("p").each((i, e) => {
			const el = $(e);
			const t = el.text();

			if (t.replace(/&nbsp;/g, "").trim() === "") {
				el.remove();
				return;
			}

			if (t === "■") {
				el.replaceWith("<hr/>");
				return;
			}

			e.attribs.ltr = undefined;
			e.attribs.style = undefined;

			const c = el.children();

			if (c.length < 1) {
				return;
			}

			const lc = c[c.length - 1];

			if (lc.type === "tag" && lc.name === "br") {
				$(lc).remove();
			}
		});

		$("i").each((i, e) => {
			e.name = "em";
		});

		$("b").each((i, e) => {
			e.name = "strong";
		});

		$("em").each((i, e) => {
			const c = $(e).children();

			if (c.length < 1) {
				return;
			}

			const lc = c[c.length - 1];

			if (lc.type === "tag" && lc.name === "br") {
				$(lc).remove();
			}
		});

		if (params.chap.title === "1.01") {
			const ps = $("p");

			$(ps[0]).remove();
			$(ps[1]).remove();
			$(ps[2]).remove();
		} else if (params.chap.title === "2.02") {
			$("strong").each((i, e) => {
				const el = $(e);

				if (el.text() === "") {
					el.remove();
				}
			});
		}

		const c = $.root().children();

		for (let i = 0; i < c.length; i++) {
			filterText($, c[i]);
		}

		next();
	},
} satisfies FilterModule as FilterModule;
