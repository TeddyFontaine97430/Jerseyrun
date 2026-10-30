"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import {
  addHomeBanner,
  deleteHomeBanner,
  moveHomeBanner,
  updateHomeBannerLink,
  type HomeBannerFormState,
} from "@/lib/actions/homeBanners";
import { uploadImageClient } from "@/lib/uploadClient";

const initialState: HomeBannerFormState = { status: "idle" };

type Banner = { id: string; imageUrl: string; link: string };

function BannerRow({
  banner,
  number,
  isFirst,
  isLast,
}: {
  banner: Banner;
  number: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [link, setLink] = useState(banner.link);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateHomeBannerLink(banner.id, link);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleDelete() {
    if (!confirm("Supprimer cette bannière de la page d'accueil ?")) return;
    startTransition(() => deleteHomeBanner(banner.id));
  }

  function handleMove(direction: "up" | "down") {
    startTransition(() => moveHomeBanner(banner.id, direction));
  }

  const arrowClass =
    "flex h-6 w-6 items-center justify-center rounded border border-white/10 text-neutral-300 hover:border-accent hover:text-accent disabled:opacity-30";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-neutral-800/50 p-3">
      <div className="flex shrink-0 flex-col gap-1">
        <button type="button" disabled={isPending || isFirst} onClick={() => handleMove("up")} aria-label="Monter" className={arrowClass}>
          ↑
        </button>
        <button type="button" disabled={isPending || isLast} onClick={() => handleMove("down")} aria-label="Descendre" className={arrowClass}>
          ↓
        </button>
      </div>
      <span className="w-5 shrink-0 text-center text-sm font-semibold text-neutral-400">{number}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.imageUrl} alt="" className="h-14 w-28 shrink-0 rounded-lg border border-white/10 object-cover" />
      <div className="min-w-[12rem] flex-1">
        <label className="mb-1 block text-xs font-medium text-neutral-400">Lien au clic</label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="/clubs/mon-club ou https://exemple.fr"
          className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-1.5 text-sm text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={isPending || link === banner.link}
          onClick={handleSave}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {saved ? "Enregistré ✓" : "Enregistrer"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:border-red-400 hover:text-red-400 disabled:opacity-50"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

export function HomeBannersForm({ banners }: { banners: Banner[] }) {
  const [state, formAction, pending] = useActionState(addHomeBanner, initialState);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      setNewImageUrl("");
      formRef.current?.reset();
    }
  }, [state]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      setNewImageUrl(await uploadImageClient(file, "home-banners"));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Échec de l'envoi de l'image. Réessayez.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {banners.length === 0 && (
        <p className="text-sm text-neutral-500">Aucune bannière pour le moment.</p>
      )}
      {banners.length > 0 && (
        <div className="space-y-3">
          {banners.map((banner, index) => (
            <BannerRow
              key={banner.id}
              banner={banner}
              number={index + 1}
              isFirst={index === 0}
              isLast={index === banners.length - 1}
            />
          ))}
        </div>
      )}

      <form
        ref={formRef}
        action={formAction}
        className="grid gap-3 rounded-lg border border-dashed border-white/20 p-4 sm:grid-cols-[auto_1fr_auto]"
      >
        <input type="hidden" name="imageUrl" value={newImageUrl} />
        <div className="flex items-center gap-3">
          {newImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={newImageUrl} alt="" className="h-14 w-28 rounded-lg border border-white/10 object-cover" />
          ) : (
            <label className="flex h-14 w-28 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-neutral-800 text-sm font-semibold text-neutral-400 hover:text-white">
              + Image
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-400">Lien au clic</label>
          <input
            name="link"
            placeholder="/clubs/mon-club ou https://exemple.fr"
            className="w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending || uploading || !newImageUrl}
            className="w-full rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60 sm:w-auto"
          >
            {uploading ? "Envoi..." : pending ? "Ajout..." : "Ajouter une bannière"}
          </button>
        </div>
      </form>
      {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
      {state.status === "error" && <p className="text-xs font-medium text-red-400">{state.message}</p>}
      {state.status === "success" && <p className="text-xs font-medium text-emerald-400">{state.message}</p>}
    </div>
  );
}
