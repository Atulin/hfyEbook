import fs from "node:fs";
import { dirname, join } from "node:path";

export class UriCache {
	public cache: string[];

	private constructor(cache: string[]) {
		this.cache = cache;
	}

	public static new() {
		const cache = [];
		const files = fs.readdirSync(join(dirname(Bun.main), "cache"));

		for (let i = 0; i < files.length; i++) {
			cache.push(files[i]);
		}

		return new UriCache(cache);
	}
}
