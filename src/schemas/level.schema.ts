import { z } from "zod";

export const LevelSchema = z.object({
  // The extracted seniority level, e.g. "Junior", "Senior", or null if none found
  level: z.string().nullable(),
});

export type Level = z.infer<typeof LevelSchema>;
