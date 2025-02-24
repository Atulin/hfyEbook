import { Glob } from "bun";
import { dirname, join } from "node:path";
import { filename } from "./Helpers.js";

let uriCache: string[] | undefined;

const init = () => {
	const cache: string[] = [];
	const glob = new Glob(join(dirname(Bun.main), "cache", "*"));

	for (const file of glob.scanSync()) {
		cache.push(filename(file));
	}

	return cache;
};

export const uriCacheEntryExists = (uri: string) => {
	if (!uriCache) {
		uriCache = init();
	}

	return uriCache.indexOf(uri) > -1;
};

export const addUriCacheEntry = (uri: string) => {
	if (!uriCache) {
		uriCache = init();
	}

	uriCache.push(filename(uri));
};
