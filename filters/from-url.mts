const request = require("request");
const cheerio = require("cheerio");
const fs = require("node:fs");
const chalk = require("chalk");

function uriToId(uri) {
	return decodeURI(
		uri.replace(/http:\/\/|www\.|[\?=&#%]/g, "").replace(/[\.\/]/g, "_"),
	);
}

function get(params, callback) {
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
		{ uri: params.chap.src },
		((params, callback) => (error, response, body) => {
			if (!response || response.statusCode === 503) {
				console.log(`${chalk.red("Retrying")} ${params.chap.id}`);
				get(params, callback);
				return;
			}

			console.log(`${chalk.yellow("Fetched")} ${params.chap.id}`);

			params.uri_cache.cache.push(params.chap.id);
			params.chap.dom = cheerio.load(body, params.cheerio_flags);
			fs.writeFileSync(
				`${import.meta.dir}/../cache/${params.chap.id}`,
				body,
				{ encoding: "utf8" },
			);

			callback();
		})(params, callback, this),
	);
}

export function apply(params: Params, next: () => void) {
	params.chap.id = uriToId(params.chap.src);

	get(params, () => {
		next();
	});
}
