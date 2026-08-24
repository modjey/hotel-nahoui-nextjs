import { z } from "zod";

/**
 * Côte d'Ivoire phone number normalization.
 * Accepts: "07 00 00 00 00", "+22507000000000", "00225...", etc.
 * Returns E.164: "+225XXXXXXXXXX"
 */
export function normalizeIvoryCoastPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let n = digits.startsWith("+") ? digits.slice(1) : digits;
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("225")) n = n.slice(3);
  // CI mobile numbers are 10 digits since 2021 (07/05/01 prefixes)
  if (!/^\d{10}$/.test(n)) return null;
  return `+225${n}`;
}

const emailSchema = z.string().trim().toLowerCase().email();
const phoneInputSchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const norm = normalizeIvoryCoastPhone(v);
    if (!norm) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Numéro Côte d'Ivoire invalide" });
      return z.NEVER;
    }
    return norm;
  });

/**
 * Identifier can be email OR a CI phone number.
 * After parse, returns { channel, identifier (normalized) }
 */
export const identifierSchema = z
  .string()
  .trim()
  .min(3)
  .transform((raw, ctx) => {
    if (raw.includes("@")) {
      const r = emailSchema.safeParse(raw);
      if (!r.success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Email invalide" });
        return z.NEVER;
      }
      return { channel: "EMAIL" as const, identifier: r.data };
    }
    const norm = normalizeIvoryCoastPhone(raw);
    if (!norm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email invalide ou numéro Côte d'Ivoire invalide",
      });
      return z.NEVER;
    }
    return { channel: "SMS" as const, identifier: norm };
  });

export const otpRequestSchema = z.object({
  identifier: z.string().min(3),
});

export const otpVerifySchema = z.object({
  identifier: z.string().min(3),
  code: z.string().regex(/^\d{4,8}$/, "Code OTP invalide"),
  name: z.string().trim().min(1).max(80).optional(),
});

export const passwordLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(200),
});

export const oauthCallbackSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().url().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(), // mobile sends in body, web uses cookie
});

export type IdentifierResult = z.infer<typeof identifierSchema>;
