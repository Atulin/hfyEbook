import { dirname, join } from "node:path";
import { Glob } from "bun";
import ct from "chalk-template";
import { log } from "../lib/Logger.js";
import { SpecSchema } from "../types/spec.js";

export default async () => {
	for await (const file of new Glob(join(dirname(Bun.main), "specs", "[^_]*.json")).scan()) {
		const s = await Bun.file(file).json();
		const { data, success, error } = SpecSchema.safeParse(s);

		if (!success) {
			log.err(`Spec is invalid: ${error.message}`);
			process.exit(1);
		}

		console.log(ct`{bold.blue Spec:}  ${data?.title}`);
		console.log(ct`| {bold.cyan Author:} ${data?.creator}`);
		console.log(ct`| {bold.cyan Chapters:} ${data?.contents.length}`);
		console.log(ct`| {bold.cyan Filters:} ${data?.filters.length}`);
	}
};
