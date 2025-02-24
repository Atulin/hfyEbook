import { dirname, join } from "node:path";
import { Glob } from "bun";
import { FilterFunctionSchema, type FilterFunction, type FilterModule } from "../types/filter.js";
import { filename } from "./Helpers.js";
import { log } from "./Logger.js";

type FilterCache = Map<string, FilterFunction>;

let filterCache: FilterCache | undefined;

// biome-ignore lint/suspicious/noExplicitAny: We need to check it, whatever it is
const checkSignature = (module: any) => {
	if (!module || !module.default || !module.default.apply) {
		return false;
	}

	if (typeof module.default.apply !== "function") {
		return false;
	}

	if (module.default.apply.length !== 2) {
		return false;
	}

	const { success } = FilterFunctionSchema.safeParse(module.default.apply);

	return success;
};

const init = () => {
	const filters: FilterCache = new Map();
	const glob = new Glob(join(dirname(Bun.main), "filters", "*.ts"));

	for (const file of glob.scanSync()) {
		const fid = filename(file);

		const module = require(file) as { default: FilterModule };

		if (!checkSignature(module)) {
			log.err(`Filter ${fid} is invalid.`);
			continue;
		}

		filters.set(fid, module.default.apply);
	}

	log.dbg(`Loaded ${filters.size} filters\n${Bun.inspect(filters.keys())}`);

	return filters;
};

export const getFilter = (name: string) => {
	if (!filterCache) {
		log.dbg("Initializing filter cache");
		filterCache = init();
	}

	const filter = filterCache.get(name);

	if (!filter) {
		log.err(`Filter '${name}' not found.`);
		process.exit(1);
	}

	return filter;
};
