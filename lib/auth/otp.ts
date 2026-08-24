import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./config";
import { sendEmail } from "@/lib/email";
import { sendSms } from "./sms";
import type { OtpChannel, OtpPurpose } from "@prisma/client";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

function generateCode(length = authConfig.otp.length): string {
  const max = 10 ** length;
  return String(randomInt(0, max)).padStart(length, "0");
}

export async function createAndSendOtp(opts: {
  identifier: string;
  channel: OtpChannel;
  purpose?: OtpPurpose;
}): Promise<{ success: boolean; error?: string; debugCode?: string }> {
  const { identifier, channel, purpose = "LOGIN" } = opts;

  // Throttle: refuse if last code was issued < 30s ago
  const recent = await prisma.otpCode.findFirst({
    where: { identifier, channel, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < 30_000) {
    return { success: false, error: "Veuillez patienter avant de redemander un code." };
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + authConfig.otp.ttlMinutes * 60_000);

  await prisma.otpCode.create({
    data: {
      identifier,
      channel,
      purpose,
      codeHash: sha256(code),
      expiresAt,
    },
  });

  // Invalidate previous unconsumed codes for the same identifier+channel
  await prisma.otpCode.updateMany({
    where: { identifier, channel, consumedAt: null, codeHash: { not: sha256(code) } },
    data: { consumedAt: new Date() },
  });

  if (channel === "EMAIL") {
    const r = await sendEmail({
      to: identifier,
      subject: "Votre code de connexion - Hôtel Nahoui",
      html: emailTemplate(code),
      text: `Votre code de connexion Hôtel Nahoui : ${code}\nIl expire dans ${authConfig.otp.ttlMinutes} minutes.`,
    });
    if (!r.success && !authConfig.otp.debug) return { success: false, error: "Envoi email échoué" };
  } else {
    const r = await sendSms(
      identifier,
      `Hotel Nahoui : votre code est ${code}. Valide ${authConfig.otp.ttlMinutes} min. Ne le partagez pas.`,
    );
    if (!r.success && !authConfig.otp.debug) return { success: false, error: "Envoi SMS échoué" };
  }

  if (authConfig.otp.debug) {
    console.log(`[otp:debug] ${channel} -> ${identifier} : ${code}`);
    return { success: true, debugCode: code };
  }
  return { success: true };
}

export async function verifyOtp(opts: {
  identifier: string;
  channel: OtpChannel;
  code: string;
}): Promise<{ success: boolean; error?: string }> {
  const { identifier, channel, code } = opts;

  const otp = await prisma.otpCode.findFirst({
    where: { identifier, channel, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return { success: false, error: "Aucun code valide. Demandez un nouveau code." };
  if (otp.expiresAt < new Date()) return { success: false, error: "Code expiré." };
  if (otp.attempts >= authConfig.otp.maxAttempts) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
    return { success: false, error: "Trop de tentatives. Demandez un nouveau code." };
  }

  if (otp.codeHash !== sha256(code)) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: otp.attempts + 1 },
    });
    return { success: false, error: "Code incorrect." };
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });
  return { success: true };
}

function emailTemplate(code: string): string {
  return `<!doctype html>
<html><body style="font-family:system-ui,sans-serif;background:#f7f7f7;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.04)">
    <h1 style="font-size:20px;color:#dc2626;margin:0 0 8px">Hôtel Nahoui</h1>
    <p style="color:#333;margin:0 0 24px">Voici votre code de connexion :</p>
    <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#111;background:#fef2f2;padding:16px;border-radius:12px;text-align:center">${code}</div>
    <p style="color:#666;font-size:13px;margin:24px 0 0">Ce code expire dans ${authConfig.otp.ttlMinutes} minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
  </div>
</body></html>`;
}
