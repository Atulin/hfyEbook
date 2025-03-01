import { z } from "zod";
import type { Params } from "./params.js";

export type FilterFunction = (params: Params, next: () => void) => void | Promise<void>;

export const FilterFunctionSchema = z.custom<FilterFunction>();

export const FilterModuleSchema = z.object({
	apply: FilterFunctionSchema,
});

export type FilterModule = z.infer<typeof FilterModuleSchema>;
