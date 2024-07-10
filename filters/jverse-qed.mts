import * as utils from "./utils.mjs";
import { Params } from "../types/params.js";

export function apply(params: Params, next: () => void) {
	const $ = params.chap.dom;
	const rem = [];

	utils.removeFirst($, rem, "p", 3);

	$("li p").each((i, e) => {
		const el = $(e);

		el.parent().append(el.contents());
		el.remove();
	});

	params.purge(rem);
	next();
}
