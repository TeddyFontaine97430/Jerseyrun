"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import {
  addHomeGalleryImage,
  deleteHomeGalleryImage,
  moveHomeGalleryImage,
  updateHomeGalleryImageLink,
  type HomeGalleryFormState,
} from "@/lib/actions/homeGallery";
import { uploadImageClient } from "@/lib/uploadClient";

const initialState: HomeGalleryFormState = { status: "idle" };

type GalleryImage = { id: string; imageUrl: string; link: string };

function GalleryImageRow({
  image,
  isFirst,
  isLast,
}: {
  image: GalleryImage;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [link, setLink] = useState(image.link);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateHomeGalleryImageLink(image.id, link);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleDelete() {
    if (!confirm("Supprimer cette image de la page d'accueil ?")) return;
    startTransition(() => deleteHomeGalleryImage(image.id));
  }

  function handleMove(direction: "up" | "down") {
    startTransition(() => moveHomeGalleryImage(image.id, direction));
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-neutral-800/50 p-3">
      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          disabled={isPending || isFirst}
          onClick={() => handleMove("up")}
          aria-label="Monter"
          className="flex h-6 w-6 items-center justify-center rounded border border-white/10 text-neutral-300 hover:border-accent hover:text-accent disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          disabled={isPending || isLast}
          onClick={() => handleMove("down")}
          aria-label="Descendre"
          className="flex h-6 w-6 items-center justify-center rounded border border-white/10 text-neutral-300 hover:border-accent hover:text-accent disabled:opacity-30"
        >
          ↓
        </button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.imageUrl}
        alt=""
        className="h-16 w-16 shrink-0 rounded-lg border border-white/10 object-cover"
      />
      <div className="flex-1">
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
          disabled={isPending || link === image.link}
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

export function HomeGalleryForm({ images }: { images: GalleryImage[] }) {
  const [state, formAction, pending] = useActionState(addHomeGalleryImage, initialState);
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
      const url = await uploadImageClient(file, "home-gallery");
      setNewImageUrl(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Échec de l'envoi de l'image. Réessayez.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="space-y-3">
          {images.map((image, index) => (
            <GalleryImageRow
              key={image.id}
              image={image}
              isFirst={index === 0}
              isLast={index === images.length - 1}
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
            <img src={newImageUrl} alt="" className="h-16 w-16 rounded-lg border border-white/10 object-cover" />
          ) : (
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-neutral-800 text-2xl text-neutral-600 hover:text-neutral-400">
              +
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
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
            {uploading ? "Envoi..." : pending ? "Ajout..." : "Ajouter"}
          </button>
        </div>
      </form>
      {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
      {state.status === "error" && <p className="text-xs font-medium text-red-400">{state.message}</p>}
      {state.status === "success" && <p className="text-xs font-medium text-emerald-400">{state.message}</p>}
    </div>
  );
}
