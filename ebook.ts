import { join } from "node:path";
import { parseArgs } from "node:util";
import * as cheerio from "cheerio";
import { getFilter } from "./lib/FilterManager.js";
import { ensureDir } from "./lib/Helpers.js";
import { selectSpec } from "./lib/SpecSelector.js";
import type { Params } from "./types/params.js";
import { type Contents, type InternalSpec, type Spec, SpecSchema } from "./types/spec.js";
import { log } from "./lib/Logger.js";

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

function Finalize(params: Params) {
	const spec = params.spec;

	if (++spec.loaded === spec.contents.length) {
		// params.chap = null;

		if (spec.output.constructor === String) {
			const fn = getFilter(spec.output);
			fn(params, () => {});
		} else if (Array.isArray(spec.output)) {
			const ops: ((params: Params, next: () => void) => void)[] = [];

			for (const filter of spec.output) {
				const fn = getFilter(filter);
				ops.push(fn);
			}

			Sequence(ops, params);
		} else {
			log.err(
				"Unable to interpret the output filter reference. It must be either a string or array of strings.",
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
		log.err("Cannot create a sequence of less than two operations.");
		process.exit(1);
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
	log.err(`Spec is invalid: ${error.message}`);
	process.exit(1);
}

const sched: { [key: string]: [((params: Params, next: () => void) => void)[], Params][] } = {};

const spec = data as InternalSpec;
spec.loaded = 0;

log.dbg(`Spec has ${spec.filters.length} filters\n${Bun.inspect(spec.filters)}`);

for (let i = 0; i < spec.contents.length; i++) {
	const chap = spec.contents[i];
	const params: Params = {
		spec: spec,
		chap: chap,
		cheerio_flags: { decodeEntities: false },
	};

	if (typeof chap.title !== "string") {
		log.err(`Each chapter must contain a "title" property (string).`);
		process.exit(1);
	}

	if (typeof chap.src !== "string") {
		log.err(`Each chapter must contain a "src" property (string).`);
		process.exit(1);
	}

	params.chap.id = `${i}`;
	params.chap.dom = cheerio.load("");

	const ops: ((params: Params, next: () => void) => void)[] = [];
	const filter_type = Object.prototype.toString.call(spec.filters);

	if (Array.isArray(spec.filters)) {
		for (const filter of spec.filters) {
			const fn = getFilter(filter);
			ops.push(fn);
		}
	} else if (filter_type === "[object Object]") {
		if (typeof chap.filters !== "string") {
			log.err(
				`In "${chap.title}": When a collection of filters is specified, each chapter must also specify witch filter chain to use.`,
			);
			process.exit(1);
		}

		if (!(chap.filters in spec.filters)) {
			log.err(`In "${chap.title}"; Cannot resolve the filter chain "${chap.filters}".`);
			process.exit(1);
		}

		const filters = spec.filters[chap.filters] ?? [];

		for (const filter of filters) {
			const fn = getFilter(filter);
			ops.push(fn);
		}
	} else {
		log.err(`Unsupported filter chain type "${filter_type}".`);
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
