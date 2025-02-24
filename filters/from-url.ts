import fs from "node:fs";
import chalk from "chalk";
import cheerio from "cheerio";
import request from "request";
import type { Params } from "../types/params.js";
import { addUriCacheEntry, uriCacheEntryExists } from "../lib/UriCache.js";

function uriToId(uri: string) {
	return decodeURI(uri.replace(/http:\/\/|www\.|[\?=&#%]/g, "").replace(/[\.\/]/g, "_"));
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
		((params, callback) => (error, response, body) => {
			if (!response || response.statusCode === 503) {
				console.log(`${chalk.red("Retrying")} ${params.chap.id}`);
				get(params, callback);
				return;
			}

			console.log(`${chalk.yellow("Fetched")} ${params.chap.id}`);

			params.chap.dom = cheerio.load(body, params.cheerio_flags);
			fs.writeFileSync(`${import.meta.dir}/../cache/${params.chap.id}`, body, {
				encoding: "utf8",
			});
			addUriCacheEntry(params.chap.id);

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
