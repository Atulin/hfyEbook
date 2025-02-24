import { dirname, join } from "node:path";
import chalk from "chalk";
import { filename } from "./Helpers.js";
import { Glob } from "bun";
import { FilterModuleSchema, type FilterFunction } from "../types/filter.js";

const ERROR_TAG = `${chalk.red("Error")}: `;

export type Filters = Record<string, FilterFunction>;

let filterCache: Filters | undefined;

const init = () => {
	const filters: Filters = {};
	const glob = new Glob(join(dirname(Bun.main), "filters", "*.ts"));

	for (const file of glob.scanSync()) {
		const fid = filename(file);

		const { success, error, data } = FilterModuleSchema.safeParse(require(file));

		if (!success) {
			console.log(`${ERROR_TAG}Filter ${fid} is invalid: ${error.message}`);
			continue;
		}

		filters[fid] = data.apply;
	}

	return filters;
};

export const getFilter = (name: string) => {
	if (!filterCache) {
		filterCache = init();
	}

	return filterCache[name];
};
