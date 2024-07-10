const cheerio = require("cheerio");
const marked = require("marked");
const fs = require("node:fs");
const chalk = require("chalk");

export function apply(params: Params, next: () => void) {
	const chap = params.chap;
	const md = fs.readFileSync(chap.src, { encoding: "utf8" });

	console.log(`${chalk.green("Loading")} ${chap.src}`);
	chap.dom = cheerio.load(marked(md), params.cheerio_flags);
	chap.id = chap.src.replace(/[\/,\.]/, "").replace(/[\/,\.]/g, "-");
	next();
}
