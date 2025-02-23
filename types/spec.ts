import { z } from "zod";
import Root = cheerio.Root;

export const FilterSchema = z.union([
	z.string(),
	z.string().array(),
	z.record(z.string(), z.string().array()),
]);

export type Filters = z.infer<typeof FilterSchema>;

export const ContentsSchema = z.object({
	byline: z.string().optional(),
	title: z.string(),
	src: z.string(),
	id: z.string(),
	dom: z.custom<Root>(),
	filters: FilterSchema,
	"no-preamble-treshold": z.number().optional(),
	"sw-part-index": z.number().optional(),
});

export type Contents = z.infer<typeof ContentsSchema>;

export const SpecSchema = z.object({
	patreon: z.string().optional(),
	title: z.string(),
	creator: z.string(),
	filters: FilterSchema,
	filename: z.string(),
	output: z.string().array(),
	contents: z.array(ContentsSchema),
	loaded: z.number(),
	"no-preamble-treshold": z.number().optional(),
});

export type Spec = z.infer<typeof SpecSchema>;
