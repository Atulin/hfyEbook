import fs from "node:fs";
import { join } from "node:path";
import type { FilterModule } from "../types/filter.js";
import type { Params } from "../types/params.js";

const output = Bun.env.OUTPUT ?? "output";

export default {
	apply(params: Params, next: () => void) {
		const spec = params.spec;
		const oname = join(output, `${spec.filename}.html`);
		const vspace = "\n    <p><br/></p><p><br/></p><p><br/></p>\n\n";

		let html = [
			'<?xml version="1.0" encoding="utf-8"?>',
			'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">',
			'<html xmlns="http://www.w3.org/1999/xhtml">',
			"  <head>",
			`    <title>${spec.title}</title>`,
			'    <meta content="application/xhtml+xml; charset=utf-8" http-equiv="Content-Type"/>',
			'    <style type="text/css">',
			fs
				.readFileSync("templates/style.css", "utf-8")
				.replace(/^/g, "      ")
				.replace(/\n/g, "\n      "),
			"      .title { font-size: 2.5em; line-height: 1em; font-weight: bold; margin: 0; }",
			"      .author { font-size: 1.2em; line-height: 1em; font-weight: bold; margin: 0; }",
			"      .patreon { font-size: 1.2em; line-height: 1em; margin: 0; }",
			"      .toc-item { line-height: 2em; margin: 0; margin-left: 60pt; }",
			"    </style>",
			"  </head>",
			"  <body>",
			`    <p class="center"><center><div class="title">${spec.title.replace(/\n/g, "<br/>")}</div></center></p>`,
			`    <p class="center"><center><div class="author">By ${spec.creator}</div></center></p>`,
		].join("\n");

		console.log(`Building ${oname}`);

		if (spec.patreon) {
			html += `    <p class="center"><center><div class="patreon">Donate securely to the author at <a href="${spec.patreon}">patreon.com</a></div></center></p>\n`;
		}

		html += vspace;
		html += '    <h1 class="toc-item">Table of contents</h1><br />\n';

		for (let i = 0; i < spec.contents.length; i++) {
			const chap = spec.contents[i];

			html += `    <a class="toc-item" href="#${chap.id}">${chap.title}</a><br/>\n`;
		}

		html += vspace;

		for (let i = 0; i < spec.contents.length; i++) {
			const chap = spec.contents[i];

			html += `    <h1 id="${chap.id}">${chap.title}</h1>\n`;

			if (chap.byline) {
				html += `    <p class="byline">By ${chap.byline}</p>\n`;
			}

			html += '    <div class="chapter">\n';
			html += `${chap.dom.xml().replace(/^/g, "      ").replace(/\n/g, "\n      ")}\n`;
			html += `    </div>\n${i < spec.contents.length - 1 ? "\n" : ""}`;
		}

		html += ["  </body>", "</html>"].join("\n");

		fs.writeFileSync(oname, html, "utf-8");
		next();
	},
} satisfies FilterModule as FilterModule;
