import { exists, mkdir } from "node:fs/promises";
import { dirname, join, parse } from "node:path";

export const ensureDir = async (dir: string) => {
	const full_path = join(dirname(Bun.main), dir); // `${import.meta.dir}/${dir}`;
	const ex = await exists(full_path);

	if (!ex) {
		await mkdir(full_path);
	}
};

export const filename = (path: string) => {
	return parse(path).name;
};
