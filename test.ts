import { join, sep } from "node:path";
import { $, Glob } from "bun";
import chalk from "chalk";

const logDir = "logs";
await $`rm -r ${logDir}`;

const files = new Glob("./specs/*.json").scan();

console.log(chalk.bold.yellow("TESTING STARTS"));

const stat = { failed: 0, passed: 0 };
for await (const file of files) {
	const spec = file.split(sep).at(-1);

	console.log(`🧪Testing spec ${chalk.bold(spec)}`);
	const start = Bun.nanoseconds();

	if (!spec) {
		console.log(` └─ ${chalk.red(`Could not extract spec name from ${file}`)}`);
		stat.failed++;
		continue;
	}

	const { stdout, stderr, exitCode } = await $`bun ebook.mts 'specs/${spec}'`
		.nothrow()
		.quiet();

	const now = (Bun.nanoseconds() - start) / 1_000_000; // milliseconds
	if (exitCode === 0) {
		console.log(` └─ ${chalk.green("Success!")} ${chalk.gray(`${now} ms`)}`);
		stat.passed++;
	} else {
		console.log(` ├─ ${chalk.red("Failed!")} ${chalk.gray(`${now} ms`)}`);
		console.log(" └─ See logs for details");
		stat.failed++;
		const log = `CODE ${exitCode}\n\n=== STDOUT ===\n\n${stdout}\n\n=== STDERR ===\n\n${stderr}`;
		await Bun.write(join(logDir, `${spec.slice(0, spec.length - 5)}.log`), log);
	}
}

console.log(`${chalk.green("Passed:")} ${stat.passed}`);
console.log(`${chalk.red("Failed:")} ${stat.failed}`);

if (stat.failed !== 0) {
	process.exit(2);
}
