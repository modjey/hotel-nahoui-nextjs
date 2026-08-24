import { authConfig } from "./config";

/**
 * TPECloud SMS sender (Côte d'Ivoire).
 * Generic POST JSON to TPECLOUD_API_URL with Bearer auth.
 * Adapt to your final TPECloud contract if it differs (this is a thin wrapper).
 */
export async function sendSms(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  const { apiUrl, apiKey, senderId } = authConfig.tpecloud;

  if (!apiKey) {
    if (!authConfig.isProd || authConfig.otp.debug) {
      console.warn(`[sms:debug] To=${to} | ${message}`);
      return { success: true };
    }
    return { success: false, error: "TPECLOUD_API_KEY not configured" };
  }

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        sender: senderId,
        to,
        message,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[sms] TPECloud error", res.status, text);
      return { success: false, error: `TPECloud ${res.status}` };
    }
    return { success: true };
  } catch (err) {
    console.error("[sms] error", err);
    return { success: false, error: "SMS send failed" };
  }
}
