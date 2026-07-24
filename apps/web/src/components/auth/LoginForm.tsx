"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);

  const next = searchParams.get("next") ?? "/app/overview-1";
  const safeNext = next.startsWith("/") ? next : "/app/overview-1";

  useEffect(() => {
    const error = searchParams.get("error");

    if (error === "missing_code") {
      setMessage(
        "Der Anmeldelink war unvollständig. Bitte fordere einen neuen Magic Link an.",
      );
    } else if (error === "confirmation_failed") {
      setMessage(
        "Der Anmeldelink konnte nicht bestätigt werden. Bitte fordere einen neuen an.",
      );
    }
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;

    async function redirectIfSignedIn() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted && session) {
        router.replace(safeNext);
      }
    }

    void redirectIfSignedIn();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        router.replace(safeNext);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, safeNext]);

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`Anmeldung fehlgeschlagen: ${error.message}`);
      setIsSubmitting(false);
      return;
    }

    router.replace(safeNext);
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setMessage("Bitte gib zuerst deine E-Mail-Adresse ein.");
      return;
    }

    setIsSendingMagicLink(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(safeNext)}`,
      },
    });

    if (error) {
      setMessage(`Magic Link fehlgeschlagen: ${error.message}`);
    } else {
      setMessage(
        "Magic Link wurde versendet. Bitte öffne den Link aus der E-Mail in diesem Browser.",
      );
    }

    setIsSendingMagicLink(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-stone-100 p-6">
      <div className="flex w-full max-w-sm flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Anmelden</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Melde dich mit E-Mail und Passwort an.
          </p>
        </div>

        <form
          className="flex flex-col gap-3.5"
          onSubmit={handlePasswordSubmit}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Wird angemeldet …" : "Anmelden"}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>oder</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isSendingMagicLink}
          onClick={() => void handleMagicLink()}
        >
          {isSendingMagicLink ? "Wird gesendet …" : "Magic Link senden"}
        </Button>

        {message ? <p className="text-sm text-foreground">{message}</p> : null}

        <p className="text-sm text-muted-foreground">
          Noch kein Konto?{" "}
          <Link
            className="font-medium text-foreground underline"
            href={`/register?next=${encodeURIComponent(safeNext)}`}
          >
            Registrieren
          </Link>
        </p>
      </div>
    </main>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-6">
          <p>Laden …</p>
        </main>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
