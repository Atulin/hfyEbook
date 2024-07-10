import fs from "node:fs";
import chalk from "chalk";
import * as cheerio from "cheerio";
import { marked } from "marked";
import request from "request";
import {Params} from "../types/params.js";

marked.escape = (html, encode) => html;

function getContinuations(set, author) {
	// Recursively search through comments, looking for plausible continuations
	for (const key in set) {
		const c = set[key].data;

		if (c.author === author && c.body_html.length > 1000) {
			let html = `\n\n\n------\n\n\n${c.body}`;

			if (c.replies.data)
				html += getContinuations(c.replies.data.children, author);

			return html;
		}
	}

	return "";
}

function getPostMarkdown(json) {
	const post = json[0].data.children[0].data;
	const author = post.author;
	const md = post.selftext + getContinuations(json[1].data.children, author);

	return md.replace(/&amp;/g, "&");
}

function uriToId(uri: string) {
	const tokens = uri.split("/");

	return decodeURI(tokens.slice(4, tokens.length - 1).join("_"));
}

function get(params: Params, callback: () => void) {
	if (params.uri_cache.cache.indexOf(params.chap.id) > -1) {
		console.log(`${chalk.green("Cached")} ${params.chap.id}`);
		params.chap.dom = cheerio.load(
			fs.readFileSync(
				`${import.meta.dir}/../cache/${params.chap.id}`,
				{ encoding: "utf8" },
			),
			params.cheerio_flags,
		);
		callback();
		return;
	}

	request(
		{
			uri: `${params.chap.src}.json`,
			headers: { "User-Agent": "HFY Bot" },
		},
		((params, callback) => (response, body) => {
			if (!response || response.statusCode === 503) {
				console.log(`${chalk.red("Retrying")} ${params.chap.id}`);
				get(params, callback);
				return;
			}

			console.log(`${chalk.yellow("Fetched")} ${params.chap.id}`);
			params.uri_cache.cache.push(params.chap.id);

			const md = getPostMarkdown(JSON.parse(body));
			let html = marked(md, { async: false }) as string;

			// Handle non-standard Reddit superscript markdown.
			html = html.replace(/\^\^([^ ]+)/g, "<sup>$1</sup>");

			params.chap.dom = cheerio.load(html, params.cheerio_flags);

			fs.writeFileSync(
				`${import.meta.dir}/../cache/${params.chap.id}`,
				params.chap.dom.html(),
				{ encoding: "utf8" },
			);

			callback();
		})(params, callback),
	);
}

export function apply(params: Params, next: () => void) {
	params.chap.id = uriToId(params.chap.src);

	get(params, () => {
		next();
	});
}
