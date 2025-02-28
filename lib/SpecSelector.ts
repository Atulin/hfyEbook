import { basename, dirname, join } from "node:path";
import { search } from "@inquirer/prompts";
import { Glob } from "bun";
import Fuse from "fuse.js";
import { toHeaderCase } from "js-convert-case";
import { filename } from "./Helpers.js";

export const selectSpec = async (args: { spec: string }) => {
	if (Bun.stringWidth(args.spec) > 0) {
		return args.spec;
	}

	const specs = [...new Glob(join(dirname(Bun.main), "specs/[^_]*.json")).scanSync()];
	const fuse = new Fuse(specs, {});

	return await search({
		message: "Select a spec",
		source: (input) => {
			if (!input) {
				return [];
			}

			return fuse
				.search(input)
				.map((result) => basename(result.item))
				.map((spec) => ({
					name: toHeaderCase(filename(spec)),
					value: spec,
				}))
				.sort((a, b) => a.name.localeCompare(b.name));
		},
	}).catch(() => {
		process.exit(0);
	});
};
