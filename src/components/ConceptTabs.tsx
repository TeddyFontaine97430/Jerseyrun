"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  registerClub,
  confirmClubRegistrationCode,
  resendClubRegistrationCode,
  type ClubRegistrationState,
} from "@/lib/actions/club-registration";
import { SPORTS } from "@/lib/sports";

const initialState: ClubRegistrationState = { status: "idle" };

export function ConceptTabs({
  defaultTab,
  intro,
}: {
  defaultTab: "concept" | "inscription";
  intro: { p1: string; p2: string; p3: string };
}) {
  const [tab, setTab] = useState<"concept" | "inscription">(defaultTab);
  const [requestState, requestAction, requestPending] = useActionState(registerClub, initialState);
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmClubRegistrationCode, initialState);
  const [stage, setStage] = useState<"form" | "code">("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendPending, startResendTransition] = useTransition();
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (requestState.status === "code_sent" && requestState.email) {
      setStage("code");
      setPendingEmail(requestState.email);
    }
  }, [requestState]);

  return (
    <div>
      <div className="mb-10 flex justify-center gap-2 rounded-full bg-white/10 p-1.5">
        <button
          type="button"
          onClick={() => setTab("concept")}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
            tab === "concept" ? "bg-navy text-white shadow" : "text-neutral-300 hover:text-white"
          }`}
        >
          Le concept
        </button>
        <button
          type="button"
          onClick={() => setTab("inscription")}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
            tab === "inscription" ? "bg-accent text-white shadow" : "text-neutral-300 hover:text-accent"
          }`}
        >
          Inscription club
        </button>
      </div>

      {tab === "concept" ? (
        <div className="mx-auto max-w-2xl space-y-6 text-neutral-300">
          <p>{intro.p1}</p>
          <p>{intro.p2}</p>
          <p>{intro.p3}</p>
          <p>
            Vous représentez un club et souhaitez rejoindre l&apos;aventure ?
            Rendez-vous dans l&apos;onglet{" "}
            <button
              type="button"
              onClick={() => setTab("inscription")}
              className="font-semibold text-accent underline underline-offset-2"
            >
              Inscription club
            </button>{" "}
            pour déposer votre demande.
          </p>
        </div>
      ) : stage === "form" ? (
        <div className="mx-auto max-w-lg">
          <p className="mb-6 text-center text-neutral-400">
            Renseignez les informations de votre club. Un code de confirmation vous sera envoyé par email avant
            l&apos;envoi de votre demande.
          </p>
          <form
            action={requestAction}
            className="grid gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-sm"
          >
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-white">
                Nom du club
              </label>
              <input
                id="name"
                name="name"
                required
                className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
                placeholder="ex: AS Rugby Club"
              />
            </div>
            <div>
              <label htmlFor="sport" className="mb-1 block text-sm font-medium text-white">
                Sport du club
              </label>
              <select
                id="sport"
                name="sport"
                required
                defaultValue=""
                className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white focus:border-accent focus:outline-none"
              >
                <option value="" disabled>
                  Sélectionnez un sport
                </option>
                {SPORTS.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-white">
                Numéro de téléphone
              </label>
              <input
                id="phone"
                name="phone"
                required
                className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
                placeholder="06 00 00 00 00"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-white">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
                placeholder="contact@monclub.fr"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-white">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
                placeholder="8 caractères minimum"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Il vous permettra de vous connecter à votre espace club une fois votre inscription validée.
              </p>
            </div>
            <div>
              <label className="flex items-start gap-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-neutral-800 text-accent focus:ring-accent"
                />
                <span>
                  J&apos;ai lu et j&apos;accepte les{" "}
                  <a
                    href="/conditions-club"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-accent underline underline-offset-2"
                  >
                    conditions d&apos;utilisation pour les clubs
                  </a>{" "}
                  (frais Stripe, versement direct, gestion du stock).
                </span>
              </label>
            </div>
            <button
              type="submit"
              disabled={requestPending}
              className="mt-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
            >
              {requestPending ? "Envoi..." : "Recevoir mon code de confirmation"}
            </button>
            {requestState.status === "error" && (
              <p className="text-sm font-medium text-red-400">{requestState.message}</p>
            )}
          </form>
        </div>
      ) : confirmState.status === "success" ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-neutral-900 p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-emerald-400">{confirmState.message}</p>
        </div>
      ) : (
        <div className="mx-auto max-w-lg">
          <p className="mb-6 text-center text-neutral-400">
            Un code à 6 chiffres a été envoyé à <strong className="text-white">{pendingEmail}</strong>. Saisissez-le
            ci-dessous pour confirmer votre email et finaliser votre demande d&apos;inscription.
          </p>
          <form
            action={confirmAction}
            className="grid gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-sm"
          >
            <input type="hidden" name="email" value={pendingEmail} />
            <div>
              <label htmlFor="code" className="mb-1 block text-sm font-medium text-white">
                Code de confirmation
              </label>
              <input
                id="code"
                name="code"
                required
                inputMode="numeric"
                maxLength={6}
                className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2.5 text-center text-lg tracking-[0.5em] text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
                placeholder="000000"
              />
            </div>
            <button
              type="submit"
              disabled={confirmPending}
              className="mt-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
            >
              {confirmPending ? "Vérification..." : "Confirmer et envoyer ma demande"}
            </button>
            {(confirmState.status === "error" || confirmState.status === "code_sent") && confirmState.message && (
              <p className="text-sm font-medium text-red-400">{confirmState.message}</p>
            )}
            <button
              type="button"
              disabled={resendPending}
              onClick={() =>
                startResendTransition(async () => {
                  const result = await resendClubRegistrationCode(pendingEmail);
                  setResendMessage(result.message ?? null);
                })
              }
              className="text-sm font-medium text-neutral-400 hover:text-white disabled:opacity-60"
            >
              {resendPending ? "Envoi..." : "Renvoyer le code"}
            </button>
            {resendMessage && <p className="text-sm font-medium text-neutral-400">{resendMessage}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
