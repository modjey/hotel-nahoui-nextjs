"use client";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const RESEND_DELAY = 30;

/** Modal de saisie du code reçu par le visiteur non connecté, avant l'envoi de sa demande. */
export function BookingOtpDialog({ open, onOpenChange, destination, codeLength = 6, ttlMinutes = 10, onVerify, onResend, onEditContact }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destination: string;
  codeLength?: number;
  ttlMinutes?: number;
  /** Renvoie un message d'erreur, ou null si le code est valide. */
  onVerify: (code: string) => Promise<string | null>;
  /** Renvoie un message d'erreur, ou null si un nouveau code est parti. */
  onResend: () => Promise<string | null>;
  onEditContact: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState<"verify" | "resend" | null>(null);
  const [resendIn, setResendIn] = useState(RESEND_DELAY);

  // Réinitialise la saisie à chaque ouverture (ajustement pendant le rendu, sans effet en cascade).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setCode("");
      setError(null);
      setInfo(null);
      setResendIn(RESEND_DELAY);
    }
  }

  useEffect(() => {
    if (!open || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [open, resendIn]);

  const verify = async (value = code) => {
    if (value.length < codeLength || busy) return;
    setBusy("verify");
    setError(null);
    setInfo(null);
    const err = await onVerify(value);
    setBusy(null);
    if (err) {
      setError(err);
      setCode("");
    }
  };

  const resend = async () => {
    setBusy("resend");
    setError(null);
    setInfo(null);
    const err = await onResend();
    setBusy(null);
    if (err) return setError(err);
    setCode("");
    setResendIn(RESEND_DELAY);
    setInfo("Un nouveau code vient de vous être envoyé.");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="z-[60] max-w-md gap-0 rounded-none sm:rounded-none border-0 border-t-4 border-t-primary bg-card p-6 sm:p-8">
        <DialogHeader className="text-left sm:text-left pr-6">
          <DialogTitle className="font-display text-2xl sm:text-3xl font-normal tracking-normal leading-tight">Saisissez votre code</DialogTitle>
          <DialogDescription className="pt-1 text-sm text-foreground/80 text-pretty">
            Code à {codeLength} chiffres envoyé à{" "}
            <span className="font-medium text-foreground break-all">{destination}</span>. Il reste valable {ttlMinutes} minutes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="mt-6">
          <InputOTP
            maxLength={codeLength}
            value={code}
            onChange={(v) => { setCode(v); setError(null); }}
            onComplete={(v: string) => verify(v)}
            pattern={REGEXP_ONLY_DIGITS}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            disabled={busy === "verify"}
            aria-label="Code de vérification"
            aria-invalid={Boolean(error)}
            containerClassName="justify-center"
          >
            <InputOTPGroup className="gap-2">
              {Array.from({ length: codeLength }, (_, i) => (
                <InputOTPSlot
                  key={i}
                  index={i}
                  className={`h-14 w-11 sm:w-12 border bg-background font-display text-2xl tabular shadow-none first:rounded-none last:rounded-none ${error ? "border-destructive" : "border-border"}`}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <div aria-live="polite" className="min-h-6 mt-3 text-center text-sm">
            {error ? <p role="alert" className="text-destructive">{error}</p> : info ? <p className="text-muted-foreground">{info}</p> : null}
          </div>

          <button
            type="submit"
            disabled={busy !== null || code.length < codeLength}
            className="btn-fill-editorial mt-3 w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy === "verify" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy === "verify" ? "Vérification…" : "Valider et envoyer ma demande"}
          </button>
        </form>

        <div className="mt-6 border-t border-border pt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
          {resendIn > 0 ? (
            <span className="text-muted-foreground min-h-11 inline-flex items-center tabular">Renvoyer le code dans {resendIn} s</span>
          ) : (
            <button type="button" onClick={resend} disabled={busy !== null} className="link-underline text-foreground min-h-11 inline-flex items-center gap-2 disabled:opacity-50">
              {busy === "resend" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              Renvoyer le code
            </button>
          )}
          <button type="button" onClick={onEditContact} disabled={busy !== null} className="text-muted-foreground hover:text-foreground underline underline-offset-4 min-h-11">
            Modifier mes coordonnées
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Rien reçu ? Pensez à vérifier vos courriers indésirables.</p>
      </DialogContent>
    </Dialog>
  );
}
