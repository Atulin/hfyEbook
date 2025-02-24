import chalk from "chalk";
import cheerio from "cheerio";
import request, { type RequestCallback } from "request";
import type { Params } from "../types/params.js";

import fs from "node:fs";
import { uriCacheEntryExists } from "../lib/UriCache.js";

function uriToId(uri: string) {
	const tokens = uri.split("/");

	return `HFYA_${decodeURI(tokens.slice(tokens.length - 2, tokens.length).join("_"))}`;
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
		{ uri: params.chap.src },
		(
			(parmas, callback, uri_cache): RequestCallback =>
			(error: unknown, response: request.Response | null, body) => {
				if (!response || response.statusCode === 503) {
					console.log(`${chalk.red("Retrying")} ${params.chap.id}`);
					get(params, callback);
					return;
				}
				// hfy-archive has been moved and redirects the links with the following construct:
				// requests does not follow these automatically
				const regex = /link rel="canonical" href="([^"]+)[^>]+/;
				const match = regex.exec(body);
				if (match !== null) {
					if (match[1] !== undefined) {
						// We need a new request to fetch the real page
						const host = response.req.res.request.uri.host;
						request.get(
							{
								url: `http://${host}${match[1]}`,
							},
							(error, response, body) => {
								if (error) {
									console.log(error);
								}
								handleResponse(params, body, callback);
							},
						);
					}
				} else {
					// The webpage doesn't contain a redirect
					// Possibly this should be an error, I don't know if the archive
					// does still host other stories or is being phased out.
					handleResponse(params, body, callback);
				}
			}
		)(params, callback, this),
	);
}

function handleResponse(params, body, callback) {
	// Abstracted handling of webpage
	console.log(`${chalk.yellow("Fetched")} ${params.chap.id}`);
	params.uri_cache.cache.push(params.chap.id);

	const $ = cheerio.load(body, params.cheerio_flags);
	console.log("Lengte van geladen ding:");
	console.log($.html().length);

	let content = $("article").contents();

	$.root().children().remove();
	$.root().append(content);
	$($.root().contents()[0]).remove(); // Remove doctype tag

	content = $.root().contents();

	for (let i = 0; i < content.length; i++) {
		const e = content[i];

		if (e.type === "text" && e.data === "\n\n") {
			e.data = "\n";
		}
	}

	params.chap.dom = $;
	console.log("Lengte van schrijfding:");
	console.log($.html().length);

	fs.writeFileSync(`${import.meta.dir}/../cache/${params.chap.id}`, params.chap.dom.xml(), {
		encoding: "utf8",
	});

	callback();
}

export function apply(params: Params, next: () => void) {
	params.chap.id = uriToId(params.chap.src);

	get(params, () => {
		next();
	});
}
