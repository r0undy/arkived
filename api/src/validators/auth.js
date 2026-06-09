import { z } from 'zod';

export const turnstileVerifySchema = z.object({
  token: z.string().min(1)
});
