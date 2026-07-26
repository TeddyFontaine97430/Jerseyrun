"use client";

import { useActionState } from "react";
import { updateSiteContent, type SiteContentFormState } from "@/lib/actions/siteContent";
import type { SiteContentKey } from "@/lib/siteContent";

const initialState: SiteContentFormState = { status: "idle" };

export function SiteContentForm({ content }: { content: Record<SiteContentKey, string> }) {
  const [state, formAction, pending] = useActionState(updateSiteContent, initialState);

  return (
    <form action={formAction} className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-white">Page d&apos;accueil</h3>
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white">Texte du bandeau</label>
            <input
              name="home.badge"
              defaultValue={content["home.badge"]}
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white">Titre principal</label>
            <input
              name="home.title"
              defaultValue={content["home.title"]}
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white">Sous-titre</label>
            <textarea
              name="home.subtitle"
              rows={2}
              defaultValue={content["home.subtitle"]}
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white">Image de fond</label>
            <div className="flex items-center gap-3">
              {content["home.heroImage"] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={content["home.heroImage"]}
                  alt=""
                  className="h-14 w-24 shrink-0 rounded-lg border border-white/10 object-cover"
                />
              )}
              <input
                name="home.heroImageFile"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-dark"
              />
            </div>
            <p className="mt-1 text-xs text-neutral-500">Laissez vide pour conserver l&apos;image actuelle.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white">Titre section clubs</label>
            <input
              name="home.partnersTitle"
              defaultValue={content["home.partnersTitle"]}
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white">Sous-titre section clubs</label>
            <input
              name="home.partnersSubtitle"
              defaultValue={content["home.partnersSubtitle"]}
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-white">Page &quot;Le concept&quot;</h3>
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white">Paragraphe 1</label>
            <textarea
              name="concept.intro1"
              rows={3}
              defaultValue={content["concept.intro1"]}
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white">Paragraphe 2</label>
            <textarea
              name="concept.intro2"
              rows={3}
              defaultValue={content["concept.intro2"]}
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white">Paragraphe 3</label>
            <textarea
              name="concept.intro3"
              rows={3}
              defaultValue={content["concept.intro3"]}
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {pending ? "Enregistrement..." : "Enregistrer"}
        </button>
        {state.status === "success" && <p className="text-sm font-medium text-emerald-400">{state.message}</p>}
        {state.status === "error" && <p className="text-sm font-medium text-red-400">{state.message}</p>}
      </div>
    </form>
  );
}
