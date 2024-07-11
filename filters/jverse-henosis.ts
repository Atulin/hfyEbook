import type { Params } from "../types/params.js";

export function apply(params: Params, next: () => void) {
	params.chap.dom("p").last().remove();
	next();
}
