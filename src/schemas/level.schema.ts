import { z } from "zod";

export const LevelSchema = z.object({
  // The extracted seniority level, must be one of the 9 specific levels or null if none found
  level: z
    .enum([
      "Intern",
      "Entry",
      "Junior",
      "Mid",
      "Senior",
      "Lead",
      "Manager",
      "Director",
      "Executive",
    ])
    .nullable(),
});

export type Level = z.infer<typeof LevelSchema>;
