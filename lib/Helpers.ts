import { exists, mkdir } from "node:fs/promises";

export const ensureDir = async (dir: string) => {
	const full_path = `${import.meta.dir}/${dir}`;
	const ex = await exists(full_path);

	if (!ex) {
		await mkdir(full_path);
	}
};
