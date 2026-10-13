import type { Role } from "@prisma/client";
import { signAccessToken } from "@/lib/auth/jwt";
import { prisma, trackUser, uniqueEmail } from "./db";

export interface TestActor {
  id: string;
  email: string;
  role: Role;
  token: string;
  /** En-têtes à passer aux appels HTTP (auth Bearer, comme l'app mobile). */
  headers: Record<string, string>;
}

/**
 * Crée un utilisateur de test et un jeton d'accès signé.
 *
 * On signe directement un access token (même chemin de vérification que le
 * client mobile) plutôt que de passer par l'OTP : plus rapide, déterministe,
 * et cela évite de consommer le quota anti-abus des codes OTP.
 */
export async function createActor(role: Role = "USER"): Promise<TestActor> {
  const email = uniqueEmail(role.toLowerCase());
  const user = await prisma.user.create({
    data: { email, emailVerified: new Date(), name: `E2E ${role}`, role },
  });
  trackUser(user.id);

  const token = await signAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
  });

  return {
    id: user.id,
    email,
    role: user.role,
    token,
    headers: { Authorization: `Bearer ${token}` },
  };
}
