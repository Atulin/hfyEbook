import { dirname, join } from "node:path";
import { confirm, input, select } from "@inquirer/prompts";
import dedent from "dedent";
import { toKebabCase } from "js-convert-case";
import type { Spec } from "../types/spec.js";

const templates: Record<string, { dir: string; type: string; tpl: string }> = {
	spec: {
		dir: "specs",
		type: "json",
		tpl: JSON.stringify(
			{
				$schema: "_schema.json",
				title: "",
				filename: "",
				creator: "",
				output: [],
				filters: [],
				contents: [],
			} satisfies Spec,
			null,
			4,
		),
	},
	filter: {
		dir: "filters",
		type: "ts",
		tpl: dedent`
        import type { FilterModule } from "../types/filter.js";
		import type { Params } from "../types/params.js";

        export default {
        
            apply(params: Params, next: () => void) {
                // do something
                next();
            },
        
        } satisfies FilterModule as FilterModule;
        `.trim(),
	},
};

export default async () => {
	const kind = await select({
		message: "Select the file type to create",
		choices: [
			{
				name: "Spec",
				value: "spec",
			},
			{
				name: "Filter",
				value: "filter",
			},
		],
	});

	const { dir, type, tpl } = templates[kind];

	const name = await input({
		message: "Enter a name for the new file",
	});

	const path = join(dirname(Bun.main), dir, `${toKebabCase(name)}.${type}`);

	await Bun.write(path, tpl);

	const open = await confirm({
		message: "Open file in editor?",
		default: true,
	});

	if (open) {
		Bun.openInEditor(path);
	}
};
