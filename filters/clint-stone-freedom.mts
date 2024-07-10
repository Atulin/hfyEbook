import {Params} from "../types/params.js";

import * as utils from "./utils.mjs";
import { Params } from "../types/params.js";

export function apply(params: Params, next: () => void) {
	const chap = params.chap;
	const $ = chap.dom;
	const rem = [];

	utils.removeMatching($, rem, "p strong", /^translator note:/i);
	utils.removeMatching($, rem, "p", /^continued in comments/i);

	const rem_last_p = [
		"Stranger",
		"Hand of War",
		"Quest",
		"Retribution",
		"Fireproof",
		"Greetings",
		"The Feast",
		"Undone",
		"Susan",
		"Lost Tales",
	];

	const ps = $("p");
	const lp = $(ps[ps.length - 1]);

	if (rem_last_p.includes(chap.title) || lp.find("a").length) rem.push(lp);

	if (chap.title === "Retribution") rem.push($(ps[ps.length - 2]));
	else if (chap.title === "Greetings") {
		rem.push($(ps[ps.length - 2]));
		rem.push($(ps[ps.length - 3]));
	}

	params.purge(rem);
	next();
}
