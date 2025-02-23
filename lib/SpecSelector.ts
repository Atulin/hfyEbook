import { basename, dirname, join } from "node:path";
import { search } from "@inquirer/prompts";
import { Glob } from "bun";
import Fuse from "fuse.js";

export const selectSpec = async (args: { spec: string }) => {
	if (Bun.stringWidth(args.spec) > 0) {
		return args.spec;
	}

	const specs = [...new Glob(join(dirname(Bun.main), "specs/*.json")).scanSync()];
	const fuse = new Fuse(specs, {});

	return await search({
		message: "Select a spec",
		source: async (input) => {
			if (!input) {
				return [];
			}

			const results = fuse.search(input).map((result) => basename(result.item));
			return Promise.resolve(
				results.map((spec) => ({
					name: spec,
					value: spec,
				})),
			);
		},
	});
};
