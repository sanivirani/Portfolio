import { timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { adminProcedure, router } from "./_core/trpc";

export function ownerPinMatches(candidate: string) {
  const configuredPin = process.env.ADMIN_OWNER_PIN;
  if (!configuredPin || !candidate) return false;
  const expected = Buffer.from(configuredPin);
  const received = Buffer.from(candidate);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function ownerPhoneMatches(candidate: string) {
  const configuredPhone = process.env.ADMIN_OWNER_PHONE;
  if (!configuredPhone || !candidate) return false;
  const expected = Buffer.from(configuredPhone);
  const received = Buffer.from(candidate);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export const ownerVerificationRouter = router({
  status: adminProcedure.query(async ({ ctx }) => {
    const session = await db.getOwnerVerificationSession(ctx.user.id);
    const verified = Boolean(session && session.expiresAt.getTime() > Date.now());
    return { verified, expiresAt: verified ? session?.expiresAt ?? null : null };
  }),
  verifyPin: adminProcedure
    .input(z.object({ pin: z.string().min(1).max(128), phone: z.string().min(8).max(20) }))
    .mutation(async ({ input, ctx }) => {
      if (!process.env.ADMIN_OWNER_PIN || !process.env.ADMIN_OWNER_PHONE) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Owner verification is not configured." });
      }
      if (!ownerPinMatches(input.pin) || !ownerPhoneMatches(input.phone)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Owner verification was not accepted." });
      }
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await db.markOwnerVerified(ctx.user.id, expiresAt);
      return { verified: true, expiresAt } as const;
    }),
  revoke: adminProcedure.mutation(async ({ ctx }) => {
    await db.clearOwnerVerification(ctx.user.id);
    return { revoked: true } as const;
  }),
});
