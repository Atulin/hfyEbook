import { join } from "node:path";
import { parseArgs } from "node:util";
import chalk from "chalk";
import * as cheerio from "cheerio";
import { decode_crs, purge, unescape_html } from "./lib/Cleaners.js";
import { FilterManager } from "./lib/FilterManager.js";
import { ensureDir } from "./lib/Helpers.js";
import { selectSpec } from "./lib/SpecSelector.js";
import { UriCache } from "./lib/UriCache.js";
import type { Params } from "./types/params.js";
import { type Contents, type InternalSpec, type Spec, SpecSchema } from "./types/spec.js";

const ERROR_TAG = `${chalk.red("Error")}: `;

// Ensure the 'cache' and 'output' directories exists. Create them if they do not.
await ensureDir("cache");
await ensureDir(Bun.env.OUTPUT ?? "output");

const { values: args } = parseArgs({
	args: Bun.argv,
	options: {
		spec: {
			type: "string",
			short: "s",
			default: "",
		},
	},
	strict: true,
	allowPositionals: true,
});

const selectedSpec = await selectSpec(args);

const filter_mgr = FilterManager.new();

function Finalize(params: Params) {
	const spec = params.spec;

	if (++spec.loaded === spec.contents.length) {
		// params.chap = null;

		if (spec.output.constructor === String) {
			filter_mgr.get(spec.output)(params, () => {});
		} else if (Array.isArray(spec.output)) {
			const ops: ((params: Params, next: () => void) => void)[] = [];

			for (let i = 0; i < spec.output.length; i++) {
				ops.push(filter_mgr.get(spec.output[i]));
			}

			Sequence(ops, params);
		} else {
			console.log(
				`${ERROR_TAG}Unable to interpret the output filter reference. It must be either a string or array of strings.`,
			);
		}
	}
}

type SequenceCb = ((chapters: Contents[] | null) => void) | null;

function Sequence(
	ops: ((params: Params, next: () => void) => void)[],
	params: Params,
	cb: SequenceCb = null,
) {
	if (ops.length < 2) {
		throw `${ERROR_TAG}Cannot create a sequence of less than two operations.`;
	}

	let last = ((params, cb) => () => {
		Finalize(params);
		if (cb) {
			cb(null);
		}
	})(params, cb);

	for (let i = ops.length - 1; i >= 0; i--) {
		last = ((cur, nxt) => () => {
			cur?.(params, nxt);
		})(ops[i], last);
	}

	last();
}

// Load the spec. Start processing.
const json = await Bun.file(join(import.meta.dir, "specs", selectedSpec)).json();

const { data, success, error } = SpecSchema.safeParse(json);

if (!success) {
	console.log(`${ERROR_TAG}Spec is invalid: ${error.message}`);
	process.exit(1);
}

const sched: { [key: string]: [((params: Params, next: () => void) => void)[], Params][] } = {};
const uri_cache = UriCache.new();

const spec = data as InternalSpec;
spec.loaded = 0;

for (let i = 0; i < spec.contents.length; i++) {
	const chap = spec.contents[i];
	const params: Params = {
		spec: spec,
		chap: chap,
		unescape_html: unescape_html,
		decode_crs: decode_crs,
		purge: purge,
		uri_cache: uri_cache,
		cheerio_flags: { decodeEntities: false },
	};

	if (typeof chap.title !== "string") {
		console.log(`${ERROR_TAG}Each chapter must contain a "title" property (string).`);
		process.exit(1);
	}

	if (typeof chap.src !== "string") {
		console.log(`${ERROR_TAG}Each chapter must contain a "src" property (string).`);
		process.exit(1);
	}

	params.chap.id = `${i}`;
	params.chap.dom = cheerio.load("");

	const ops: ((params: Params, next: () => void) => void)[] = [];
	const filter_type = Object.prototype.toString.call(spec.filters);

	if (Array.isArray(spec.filters)) {
		for (let fi = 0; fi < spec.filters.length; fi++) {
			ops.push(filter_mgr.get(spec.filters[fi]));
		}
	} else if (filter_type === "[object Object]") {
		if (typeof chap.filters !== "string") {
			console.log(
				`${ERROR_TAG}In "${chap.title}": When a collection of filters is specified, each chapter must also specify witch filter chain to use.`,
			);
			process.exit(1);
		}

		const f = spec.filters as { [key: string]: string[] };

		if (!(chap.filters in f)) {
			console.log(
				`${ERROR_TAG}In "${chap.title}"; Cannot resolve the filter chain "${chap.filters}".`,
			);
			process.exit(1);
		}

		const filters = f[chap.filters] ?? [];

		for (let fi = 0; fi < filters.length; fi++) {
			ops.push(filter_mgr.get(filters[fi]));
		}
	} else {
		console.log(`${ERROR_TAG}Unsupported filter chain type "${filter_type}".`);
		process.exit(1);
	}

	if (chap.src in sched) {
		sched[chap.src].push([ops, params]);
	} else {
		sched[chap.src] = [[ops, params]];
	}
}

for (const src in sched) {
	if (!Object.hasOwn(sched, src)) {
		continue;
	}

	const chapters = sched[src];

	if (chapters.length === 1) {
		Sequence(chapters[0][0], chapters[0][1]);
	} else {
		Sequence(
			chapters[0][0],
			chapters[0][1],
			((chapters) => () => {
				for (let ci = 1; ci < chapters.length; ci++) {
					Sequence(chapters[ci][0], chapters[ci][1]);
				}
			})(chapters),
		);
	}
}
