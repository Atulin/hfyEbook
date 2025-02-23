import { z } from "zod";
import Root = cheerio.Root;

export const FilterSchema = z.union([z.string().array(), z.record(z.string(), z.string().array())]);

export type Filters = z.infer<typeof FilterSchema>;

export const ContentsSchema = z.object({
	byline: z
		.string()
		.optional()
		.describe(
			"If specified, this will add an author byline to this chapter. This can be used to support collected content by various authors with full per-chapter attribution.",
		),

	title: z
		.string()
		.describe("The chapter title. Used to generate headings and when building TOCs."),

	src: z
		.string()
		.describe(
			"The source location of the material for the given chapter. This can be any value appropriate to the chosen input filter.",
		),

	"no-preamble-treshold": z.number().optional(),

	"sw-part-index": z.number().optional(),
});

export type Contents = z.infer<typeof ContentsSchema>;

export const InternalContentSchema = ContentsSchema.extend({
	id: z.string(),
	dom: z.custom<Root>(),
	filters: FilterSchema,
});

export type InternalContents = z.infer<typeof InternalContentSchema>;

export const SpecSchema = z.object({
	patreon: z.string().optional().describe("Link to the author's Patreon."),

	title: z.string().describe("Used as the book title and as the basis for the output filename."),

	creator: z
		.string()
		.describe("The name of the author. Embedded into output meta-data and used for by-lines."),

	filters: FilterSchema.describe(
		"Names of filters to be applied to each chapter sequentially, or a set of named filter name arrays.",
	),

	filename: z
		.string()
		.describe(
			"Specifies the base name for emitted output files. Omits extension, since that is appended by each output plugin (see below) as appropriate.",
		),

	output: z
		.string()
		.or(z.string().array())
		.describe(
			"Used to specify one or more integrations filters that build output files based on the filtered chapter contents.",
		),

	contents: z
		.array(ContentsSchema)
		.describe("Each element of the array is an object describing a chapter."),

	"no-preamble-treshold": z.number().optional(),
});

export type Spec = z.infer<typeof SpecSchema>;

export const InternalSpecSchema = SpecSchema.extend({
	loaded: z.number().default(0),
	contents: z.array(InternalContentSchema),
});

export type InternalSpec = z.infer<typeof InternalSpecSchema>;
