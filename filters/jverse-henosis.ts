import type { FilterModule } from "../types/filter.js";
import type { Params } from "../types/params.js";

export default {
	apply(params: Params, next: () => void) {
		params.chap.dom("p").last().remove();
		next();
	},
} satisfies FilterModule as FilterModule;
