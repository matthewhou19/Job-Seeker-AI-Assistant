import { z } from "zod";

export const SkillsSchema = z.object({
  /**
   * A list of key skills summarized from the job posting.
   */
  skills: z.array(z.string()).nonempty(),
});

export type Skills = z.infer<typeof SkillsSchema>;
