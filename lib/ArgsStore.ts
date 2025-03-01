import { parseArgs } from "node:util";

let args: { values: { spec: string }; positionals: string[] };

/**
 * Retrieves and parses command-line arguments passed to the app.
 *
 * @returns An object containing the parsed values and positionals.
 */
export const getArgs = () => {
	if (!args) {
		args = parseArgs({
			args: Bun.argv,
			options: {
				spec: {
					type: "string",
					short: "s",
					default: "",
				},
			},
			strict: true,
			allowPositionals: true,
		});
	}
	return args;
};
