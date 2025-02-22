import fs from "node:fs";
import chalk from "chalk";
import * as cheerio from "cheerio";
import { join } from "node:path";
import type { Params } from "./types/params.js";
import type { Contents, Spec } from "./types/spec.js";
import Cheerio = cheerio.Cheerio;

const ERROR_TAG = `${chalk.red("Error")}: `;
const DEBUG = false;

if (process.argv.length < 3) {
	console.log("Usage: ebook.js <spec.json>");
	process.exit(1);
}

function ensure_dir(dir: string) {
	const full_path = `${import.meta.dir}/${dir}`;

	if (!fs.existsSync(full_path)) fs.mkdirSync(full_path);
}

// Ensure the 'cache' and 'output' directories exists. Create them if they do not.
ensure_dir("cache");
ensure_dir("output");

function decode_cr(cr: string) {
	const isHex = cr[2] === "x";

	const start = isHex ? 3 : 2;
	const end = cr.length - 2;
	return String.fromCodePoint(
		Number.parseInt(cr.slice(start, end + start), isHex ? 16 : 10),
	);
}

// Decode all HTML character references to unicode.
function decode_crs(s: string) {
	let i = -1;
	let ls = s;

	while ((i = ls.search(/&#.*;/)) > -1) {
		const ni = ls.indexOf(";", i);

		ls = ls.slice(0, i) + decode_cr(ls.slice(i, ni + 1)) + ls.slice(ni + 1);
	}

	return ls;
}

function unescape_html(html: string) {
	return decode_crs(html.replace(/&amp;/g, "&"))
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(/&#39;/g, "'")
		.replace(/&amp;#39;/g, "'")
		.replace(/&amp;/g, "&");
}

function purge(set: Cheerio[]) {
	for (let i = 0; i < set.length; i++) {
		const e = set[i];

		if (DEBUG) console.log(`${chalk.red("Delete")}: [${e.text()}]`);

		e.remove();
	}
}

const cache = [];

function UriCache() {
	const files = fs.readdirSync(`${import.meta.dir}/cache`);

	for (let i = 0; i < files.length; i++) cache.push(files[i]);
}

UriCache.prototype.cache = [];

const filters: { [key: string]: { apply: () => void } } = {};

function FilterManager() {
	const files = fs.readdirSync(`${import.meta.dir}/filters`);

	for (let i = 0; i < files.length; i++) {
		const fname = files[i];
		const fid = fname.slice(0, fname.length - 3);

		filters[fid] = require(`./filters/${fname}`);
	}
}

FilterManager.prototype.get = (fid: string) => {
	const filter = filters[fid];

	if (!filter) {
		console.log(`${ERROR_TAG}No such filter: ${fid}`);
		process.exit();
	}

	return filter.apply;
};

const filter_mgr = new FilterManager();

function Finalize(params: Params) {
	const spec = params.spec;

	if (++spec.loaded === spec.contents.length) {
		// params.chap = null;

		if (spec.output.constructor === String)
			filter_mgr.get(spec.output)(params, () => {});
		else if (Array.isArray(spec.output)) {
			const ops: (() => void)[] = [];

			for (let i = 0; i < spec.output.length; i++)
				ops.push(filter_mgr.get(spec.output[i]));

			Sequence(ops, params);
		} else
			console.log(
				`${ERROR_TAG}Unable to interpret the output filter reference. It must be either a string or array of strings.`,
			);
	}
}

type SequenceCb = ((chapters: Contents[] | null) => void) | null;

function Sequence(
	ops: ((params: Params, next: () => void) => void)[],
	params: Params,
	cb: SequenceCb = null,
) {
	if (ops.length < 2)
		throw `${ERROR_TAG}Cannot create a sequence of less than two operations.`;

	let last = ((params, cb) => () => {
		Finalize(params);
		if (cb) cb(null);
	})(params, cb);

	for (let i = ops.length - 1; i >= 0; i--)
		last = ((cur, nxt) => () => {
			cur?.(params, nxt);
		})(ops[i], last);

	last();
}

// Load the spec. Start processing.
const spec: Spec = await Bun.file(
	join(import.meta.dir, process.argv[2]),
).json();
const sched: { [key: string]: [(() => void)[], Params][] } = {};
const uri_cache = new UriCache();

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
		console.log(
			`${ERROR_TAG}Each chapter must contain a "title" property (string).`,
		);
		process.exit(1);
	}

	if (typeof chap.src !== "string") {
		console.log(
			`${ERROR_TAG}Each chapter must contain a "src" property (string).`,
		);
		process.exit(1);
	}

	params.chap.id = `${i}`;
	params.chap.dom = cheerio.load("");

	const ops: (() => void)[] = [];
	const filter_type = Object.prototype.toString.call(spec.filters);

	if (Array.isArray(spec.filters)) {
		for (let fi = 0; fi < spec.filters.length; fi++)
			ops.push(filter_mgr.get(spec.filters[fi]));
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

		for (let fi = 0; fi < filters.length; fi++)
			ops.push(filter_mgr.get(filters[fi]));
	} else {
		console.log(`${ERROR_TAG}Unsupported filter chain type "${filter_type}".`);
		process.exit(1);
	}

	if (chap.src in sched) sched[chap.src].push([ops, params]);
	else sched[chap.src] = [[ops, params]];
}

for (const src in sched) {
	if (!sched.hasOwnProperty(src)) continue;

	const chapters = sched[src];

	if (chapters.length === 1) Sequence(chapters[0][0], chapters[0][1]);
	else {
		Sequence(
			chapters[0][0],
			chapters[0][1],
			((chapters) => () => {
				for (let ci = 1; ci < chapters.length; ci++)
					Sequence(chapters[ci][0], chapters[ci][1]);
			})(chapters),
		);
	}
}
