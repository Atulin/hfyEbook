import fs from "node:fs";
import chalk from "chalk";
import * as cheerio from "cheerio";
import { marked } from "marked";
import type { FilterModule } from "../types/filter.js";
import type { Params } from "../types/params.js";

export default {
	apply(params: Params, next: () => void) {
		const chap = params.chap;
		const md = fs.readFileSync(chap.src, { encoding: "utf8" });

		console.log(`${chalk.green("Loading")} ${chap.src}`);
		chap.dom = cheerio.load(marked(md, { async: false }) as string, params.cheerio_flags);
		chap.id = chap.src.replace(/[\/,\.]/, "").replace(/[\/,\.]/g, "-");
		next();
	},
} satisfies FilterModule as FilterModule;
