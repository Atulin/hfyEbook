import { select } from "@inquirer/prompts";
import { ensureDir } from "./lib/Helpers.js";

// Ensure the 'cache' and 'output' directories exists. Create them if they do not.
await ensureDir("cache");
await ensureDir(Bun.env.OUTPUT ?? "output");

const req = (file: string) => require(file).default as () => Promise<void>;

const command = await select({
	message: "Select a command",
	choices: [
		{
			name: "Build",
			description: "Build an ebook from a selected spec",
			value: req("./commands/build.js"),
		},
		{
			name: "Details",
			description: "Show details about the available specs",
			value: req("./commands/details.js"),
		},
		{
			name: "New file",
			description: "Create new spec or filter from template",
			value: req("./commands/new.js"),
		},
	],
});
await command();
