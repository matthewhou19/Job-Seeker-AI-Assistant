import { z } from "zod";

export const DomainSchema = z.object({
  /**
   * The primary job domain or field—e.g. “Software Engineering”,
   * “Data Science”, “UX/UI Design”, etc.,
   * as a concise summary of the description.
   */
  domain: z.string().nullable(),
});

export type Domain = z.infer<typeof DomainSchema>;
