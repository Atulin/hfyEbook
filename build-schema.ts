import { join } from "node:path";
import { Glob } from "bun";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { SpecSchema } from "./types/spec.js";

if (process.argv[2] === "edit") {
	for await (const file of new Glob("./specs/*.json").scan()) {
		const json = await Bun.file(file).json();
		await Bun.write(file, JSON.stringify({ $schema: "_schema.json", ...json }, null, 2));
	}
	process.exit(0);
}

const jsonSchema = zodToJsonSchema(SpecSchema.extend({ $schema: z.string() }), "mySchema");

await Bun.write(
	join(import.meta.dir, "specs", "_schema.json"),
	JSON.stringify(jsonSchema, null, 2),
);

console.log("Done");
