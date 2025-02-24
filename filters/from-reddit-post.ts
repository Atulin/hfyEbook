import fs from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import * as cheerio from "cheerio";
import { marked } from "marked";
import request, { type RequestCallback } from "request";
import { addUriCacheEntry, uriCacheEntryExists } from "../lib/UriCache.js";
import type { Params } from "../types/params.js";
import type { FilterModule } from "../types/filter.js";

function getContinuations(set: Child[], author: string) {
	// Recursively search through comments, looking for plausible continuations
	for (const key in set) {
		const c = set[key].data;

		if (c.author === author && c.body_html.length > 1000) {
			let html = `\n\n\n------\n\n\n${c.body}`;

			if (c.replies.data) {
				html += getContinuations(c.replies.data.children, author);
			}

			return html;
		}
	}

	return "";
}

type RedditResponse = { data: Data }[];
type Data = { children: Child[] };
type Child = {
	data: {
		author: string;
		selftext: string;
		body_html: string;
		body: string;
		replies: { data: { children: Child[] } };
	};
};

function getPostMarkdown(json: RedditResponse) {
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
	if (uriCacheEntryExists(params.chap.id)) {
		console.log(`${chalk.green("Cached")} ${params.chap.id}`);
		params.chap.dom = cheerio.load(
			fs.readFileSync(`${import.meta.dir}/../cache/${params.chap.id}`, {
				encoding: "utf8",
			}),
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
		(
			(params, callback): RequestCallback =>
			(error: unknown, response: request.Response | null, body) => {
				if (!response || response.statusCode === 503 || Bun.stringWidth(body) < 1) {
					console.log(`${chalk.red("Retrying")} ${params.chap.id}`);
					console.log(`Error ${error}`);
					get(params, callback);
					return;
				}

				console.log(`${chalk.yellow("Fetched")} ${params.chap.id}`);

				let json: RedditResponse;
				try {
					json = JSON.parse(body);
				} catch (e) {
					const time = Bun.nanoseconds();
					if (body.length > 0) {
						const log = `${JSON.stringify(response.headers, null, 4)}\n\n${body}`;
						Bun.write(join("logs", `${time}-${params.chap.title}.log`), log);
					}
					console.log(`ERROR ${e} (${time})`);
					throw e;
				}
				const md = getPostMarkdown(json);
				let html = marked(md, { async: false }) as string;

				// Handle non-standard Reddit superscript markdown.
				html = html.replace(/\^\^([^ ]+)/g, "<sup>$1</sup>");

				params.chap.dom = cheerio.load(html, params.cheerio_flags);

				fs.writeFileSync(
					`${import.meta.dir}/../cache/${params.chap.id}`,
					params.chap.dom.html(),
					{ encoding: "utf8" },
				);
				addUriCacheEntry(params.chap.id);

				callback();
			}
		)(params, callback),
	);
}

export default {
	apply(params: Params, next: () => void) {
		params.chap.id = uriToId(params.chap.src);

		get(params, () => {
			next();
		});
	},
} satisfies FilterModule as FilterModule;
