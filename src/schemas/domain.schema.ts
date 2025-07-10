import { z } from "zod";

export const DomainSchema = z.object({
  /**
   * The primary job domain or field from the predefined list of technical domains.
   * Choose the most specific domain that best describes the job's primary focus.
   */
  domain: z
    .enum([
      "Backend",
      "Frontend",
      "Full Stack",
      "Mobile",
      "DevOps",
      "Embedded",
      "ML",
      "Data Science",
      "QA",
      "Security",
      "Healthcare",
      "Finance",
      "E-commerce",
      "Gaming",
      "Hardware",
    ])
    .nullable(),
});

export type Domain = z.infer<typeof DomainSchema>;
