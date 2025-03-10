import { dirname, join } from "node:path";
import * as cheerio from "cheerio";
import { getArgs } from "../lib/ArgsStore.js";
import { getFilter } from "../lib/FilterManager.js";
import { log } from "../lib/Logger.js";
import { selectSpec } from "../lib/SpecSelector.js";
import type { FilterFunction } from "../types/filter.js";
import type { Params } from "../types/params.js";
import { type Contents, type InternalSpec, SpecSchema } from "../types/spec.js";

function Finalize(params: Params) {
	const spec = params.spec;

	if (++spec.loaded === spec.contents.length) {
		// params.chap = null;

		if (spec.output.constructor === String) {
			const fn = getFilter(spec.output);
			fn(params, () => {});
		} else if (Array.isArray(spec.output)) {
			const ops: FilterFunction[] = [];

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

function Sequence(ops: FilterFunction[], params: Params, cb: SequenceCb = null) {
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

	for (const op of ops.toReversed()) {
		last = ((cur, nxt) => () => {
			cur(params, nxt);
		})(op, last);
	}

	last();
}

export default async () => {
	const { values } = getArgs();

	const selectedSpec = await selectSpec(values.spec);

	// Load the spec. Start processing.
	const json = await Bun.file(join(dirname(Bun.main), "specs", selectedSpec)).json();

	const { data, success, error } = SpecSchema.safeParse(json);

	if (!success) {
		log.err(`Spec is invalid: ${error.message}`);
		process.exit(1);
	}

	const schedule: { [key: string]: { functions: FilterFunction[]; params: Params }[] } = {};

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

		params.chap.id = `${i}`;
		params.chap.dom = cheerio.load("");

		const ops: FilterFunction[] = [];
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

		if (chap.src in schedule) {
			schedule[chap.src].push({ functions: ops, params });
		} else {
			schedule[chap.src] = [{ functions: ops, params }];
		}
	}

	for (const src in schedule) {
		if (!Object.hasOwn(schedule, src)) {
			continue;
		}

		const chapters = schedule[src];

		if (chapters.length === 1) {
			Sequence(chapters[0].functions, chapters[0].params);
		} else {
			Sequence(
				chapters[0].functions,
				chapters[0].params,
				((chapters) => () => {
					for (const chapter of chapters.slice(1)) {
						Sequence(chapter.functions, chapter.params);
					}
				})(chapters),
			);
		}
	}
};
