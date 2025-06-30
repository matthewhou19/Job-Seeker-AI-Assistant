import { z } from "zod";

export const YearsSchema = z.object({
  requestYears: z.number().nullable(),
});

export type Years = z.infer<typeof YearsSchema>;
