import { z } from "zod";
import type { Params } from "./params.js";

export type FilterFunction = (params: Params, next: () => void) => void;

export const FilterModuleSchema = z.object({
	apply: z.custom<FilterFunction>(),
});

export type FilterModule = z.infer<typeof FilterModuleSchema>;
