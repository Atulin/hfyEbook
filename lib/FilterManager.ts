import fs from "node:fs";
import { dirname, join } from "node:path";
import chalk from "chalk";
import type { Params } from "../types/params.js";

const ERROR_TAG = `${chalk.red("Error")}: `;

export type Filters = { [key: string]: { apply: (params: Params, next: () => void) => void } };

export class FilterManager {
	private filters: Filters = {};

	private constructor(filters: Filters) {
		this.filters = filters;
	}

	public static new() {
		const files = fs.readdirSync(join(dirname(Bun.main), "filters"));

		const filters: Filters = {};
		for (let i = 0; i < files.length; i++) {
			const fname = files[i];
			const fid = fname.slice(0, fname.length - 3);

			filters[fid] = require(`../filters/${fname}`);
		}

		return new FilterManager(filters);
	}

	public get(fid: string) {
		const filter = this.filters[fid];

		if (!filter) {
			console.log(`${ERROR_TAG}No such filter: ${fid}`);
			process.exit();
		}

		return filter.apply;
	}
}
