import { z } from "zod";
import { InternalContentSchema, InternalSpecSchema } from "./spec.js";

export const ParamsSchema = z.object({
	spec: InternalSpecSchema,
	chap: InternalContentSchema,
	cheerio_flags: z.object({ decodeEntities: z.boolean() }),
});

export type Params = z.infer<typeof ParamsSchema>;
