import { z } from "zod";
import { InternalContentSchema, InternalSpecSchema } from "./spec.js";
import Cheerio = cheerio.Cheerio;

export const ParamsSchema = z.object({
	spec: InternalSpecSchema,
	chap: InternalContentSchema,
	unescape_html: z.function().args(z.string()).returns(z.string()),
	decode_crs: z.function().args(z.string()).returns(z.string()),
	purge: z.function().args(z.array(z.custom<Cheerio>())).returns(z.void()),
	uri_cache: z.object({ cache: z.string().array() }),
	cheerio_flags: z.object({ decodeEntities: z.boolean() }),
});

export type Params = z.infer<typeof ParamsSchema>;
