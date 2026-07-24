"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase/client";

function MagicLinkFormInner({
  mode,
}: {
  mode: "login" | "register";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: mode === "register",
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(safeNext)}`,
      },
    });

    if (error) {
      setMessage(
        mode === "register"
          ? `Registrierung fehlgeschlagen: ${error.message}`
          : `Anmeldung fehlgeschlagen: ${error.message}`,
      );
    } else {
      setMessage(
        "Magic Link wurde versendet. Bitte öffne den Link aus der E-Mail in diesem Browser.",
      );
    }

    setIsSubmitting(false);
  }

  const title =
    mode === "register" ? "Bei Spatial registrieren" : "Bei Spatial anmelden";
  const subtitle =
    mode === "register"
      ? "Erstelle ein kostenloses Konto per Magic Link. Danach stehen erweiterte Funktionen zur Verfügung."
      : "Melde dich mit deiner E-Mail an. Wir senden dir einen Magic Link.";
  const submitLabel =
    mode === "register" ? "Registrierungslink senden" : "Magic Link senden";
  const alternate =
    mode === "register" ? (
      <p className="text-sm text-muted-foreground">
        Bereits registriert?{" "}
        <Link
          className="font-medium text-foreground underline"
          href={`/login?next=${encodeURIComponent(safeNext)}`}
        >
          Anmelden
        </Link>
      </p>
    ) : (
      <p className="text-sm text-muted-foreground">
        Noch kein Konto?{" "}
        <Link
          className="font-medium text-foreground underline"
          href={`/register?next=${encodeURIComponent(safeNext)}`}
        >
          Registrieren
        </Link>
      </p>
    );

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-stone-100 p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <form
          className="flex flex-col gap-3.5"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Wird gesendet …" : submitLabel}
          </Button>
        </form>

        {message ? <p className="text-sm text-foreground">{message}</p> : null}
        {alternate}
      </div>
    </main>
  );
}

export function MagicLinkForm({ mode }: { mode: "login" | "register" }) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-6">
          <p>Laden …</p>
        </main>
      }
    >
      <MagicLinkFormInner mode={mode} />
    </Suspense>
  );
}
