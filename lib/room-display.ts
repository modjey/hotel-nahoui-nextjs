/**
 * Nom d'une chambre tel qu'affiché aux clients : sans le code interne de la chambre.
 * « Chambre Standard CH02 » (numéro CH02) → « Chambre Standard ». Le code reste visible dans l'admin.
 */
export function displayRoomName(name: string, roomNumber?: string | null): string {
  let out = name.trim();
  const codes = [roomNumber?.trim(), out.match(/\b[A-Z]{1,3}\d{1,3}\b$/)?.[0]].filter(Boolean) as string[];
  for (const code of codes) {
    const re = new RegExp(`[\\s·\\-–(N°]*${code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)?$`, "i");
    out = out.replace(re, "").trim();
  }
  return out || name;
}
