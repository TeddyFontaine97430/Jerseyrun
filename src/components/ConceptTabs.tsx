"use client";

import { useActionState, useState } from "react";
import { registerClub, type ClubRegistrationState } from "@/lib/actions/club-registration";
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
  const [state, formAction, pending] = useActionState(registerClub, initialState);

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
      ) : (
        <div className="mx-auto max-w-lg">
          <p className="mb-6 text-center text-neutral-400">
            Renseignez les informations de votre club. Votre demande sera
            examinée par l&apos;administrateur du site avant activation de
            votre espace club.
          </p>
          <form action={formAction} className="grid gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-sm">
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
            <button
              type="submit"
              disabled={pending}
              className="mt-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
            >
              {pending ? "Envoi..." : "Envoyer ma demande d'inscription"}
            </button>
            {state.status === "success" && (
              <p className="text-sm font-medium text-emerald-400">{state.message}</p>
            )}
            {state.status === "error" && (
              <p className="text-sm font-medium text-red-400">{state.message}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
