"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";
import { api, ApiError } from "@/lib/api-client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  purpose?: "booking" | "review";
}

type Step = "identifier" | "otp";

export function AuthModal({ isOpen, onClose, purpose = "booking" }: AuthModalProps) {
  const { refresh } = useAuth();
  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [normalizedIdentifier, setNormalizedIdentifier] = useState("");
  const [channel, setChannel] = useState<"EMAIL" | "SMS">("EMAIL");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const idRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep("identifier");
      setCode("");
      setSubmitting(false);
      setTimeout(() => idRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  if (!isOpen) return null;

  async function requestOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (!identifier.trim()) return;
    setSubmitting(true);
    try {
      const data = await api.post<{
        identifier: string;
        channel: "EMAIL" | "SMS";
        debugCode?: string;
      }>("/api/auth/otp/request", { identifier });
      setNormalizedIdentifier(data.identifier);
      setChannel(data.channel);
      setStep("otp");
      setResendIn(30);
      toast.success(data.channel === "EMAIL" ? "Code envoyé par e-mail" : "Code envoyé par SMS");
      if (data.debugCode) toast.message(`(dev) Code OTP : ${data.debugCode}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (code.length < 4) return;
    setSubmitting(true);
    try {
      await api.post("/api/auth/otp/verify", {
        identifier: normalizedIdentifier,
        code,
        ...(name.trim() ? { name: name.trim() } : {}),
      });
      toast.success("Connecté !");
      await refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  const oauthRedirect = (provider: "google") => {
    const currentUrl = window.location.href;
    const callbackUrl = encodeURIComponent(currentUrl);
    // Store booking flow state before redirect (only if purpose is booking)
    if (purpose === "booking" && currentUrl.includes('rooms/')) {
      // Get booking flow state from the window (if it exists)
      const bookingFlowState = (window as any).__bookingFlowState;
      if (bookingFlowState) {
        localStorage.setItem('bookingFlowState', JSON.stringify(bookingFlowState));
      }
      localStorage.setItem('bookingFlowOpen', 'true');
    }
    window.location.href = `/api/auth/oauth/${provider}?callbackUrl=${callbackUrl}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[rgb(26_12_9/0.6)]">
      <div className="bg-card w-full max-w-md overflow-hidden relative border-t-4 border-primary">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            {step === "otp" && (
              <button
                onClick={() => setStep("identifier")}
                className="h-9 w-9 flex items-center justify-center hover:bg-secondary"
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <h2 className="text-2xl font-display text-foreground">
              {step === "identifier" ? "Connexion ou inscription" : "Vérification"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center hover:bg-secondary transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {step === "identifier" ? (
          <form onSubmit={requestOtp} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Numéro de téléphone ou adresse e-mail
              </label>
              <input
                ref={idRef}
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="+225 07 00 00 00 00 ou email@exemple.com"
                className="w-full h-12 px-4 border border-input bg-background focus:outline-none focus:border-foreground"
                disabled={submitting}
                autoComplete="email"
                required
              />
            </div>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Nous vous enverrons un code de confirmation par SMS ou par e-mail.
            </p>

            <button
              type="submit"
              disabled={submitting || !identifier.trim()}
              className="btn-fill-editorial w-full disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Continuer
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-input" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">ou</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => oauthRedirect("google")}
              className="flex items-center justify-center gap-2 py-3 w-full border border-input hover:bg-secondary transition-colors"
            >
              <GoogleIcon />
              <span className="text-sm font-medium text-foreground">Google</span>
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Code envoyé{channel === "EMAIL" ? " à " : " au "}
              <span className="font-medium text-foreground">{normalizedIdentifier}</span>
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Code de vérification</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full px-4 py-3 text-center text-2xl border border-input focus:outline-none focus:border-foreground"
                disabled={submitting}
                autoFocus
                autoComplete="one-time-code"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Votre prénom <span className="text-muted-foreground font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aïcha"
                className="w-full h-12 px-4 border border-input bg-background focus:outline-none focus:border-foreground"
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || code.length < 4}
              className="btn-fill-editorial w-full disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Vérifier et se connecter
            </button>

            <div className="text-center text-sm text-muted-foreground">
              {resendIn > 0 ? (
                <span>Renvoyer le code dans {resendIn}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => requestOtp()}
                  className="text-brand-text hover:underline"
                  disabled={submitting}
                >
                  Renvoyer le code
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}


