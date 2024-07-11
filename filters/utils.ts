import Root = cheerio.Root;
import Cheerio = cheerio.Cheerio;
import type { Contents } from "../types/spec.js";

export function removeFirst(
	$: Root,
	coll: Cheerio[],
	selector: string,
	count: number,
) {
	const elems = $(selector);

	for (let i = 0; i < count; i++) coll.push($(elems[i]));
}

export function removeLast(
	$: Root,
	coll: Cheerio[],
	selector: string,
	count: number,
) {
	let c = count;
	const elems = $(selector);

	c = Math.min(c, elems.length);

	for (let i = elems.length - 1; i > elems.length - (c + 1); i--)
		coll.push($(elems[i]));
}

export function removeSingle($: Root, coll: Cheerio[], selector: string) {
	coll.push($($(selector)[0]));
}

export function removeAll($: Root, coll: Cheerio[], selector: string) {
	const elems = $(selector);

	for (let i = 0; i < elems.length; i++) coll.push($(elems[i]));
}

export function removeMatching(
	$: Root,
	coll: Cheerio[],
	selector: string,
	regexp: RegExp,
) {
	$(selector).each((i, e) => {
		const el = $(e);
		const t = el.text();

		if (t.search(regexp) === 0) coll.push(el);
	});
}

export function pruneParagraphs(
	chap: Contents,
	coll: Cheerio[],
	params: { [key: string]: [number, number, string[]] | [number, number] },
) {
	const $ = chap.dom;

	if (chap.title in params) {
		const pr = params[chap.title];
		const ps = $("p");

		for (let i = 0; i < pr[0]; i++) coll.push($(ps[i]));

		for (let i = ps.length - pr[1]; i < ps.length; i++) coll.push($(ps[i]));

		if (pr.length > 2 && pr[2]) {
			const pats = pr[2];

			for (let i = 0; i < pats.length; i++) {
				const res = $(pats[i]);

				for (let i2 = 0; i2 < res.length; i2++) coll.push($(res[i2]));
			}
		}
	}
}
