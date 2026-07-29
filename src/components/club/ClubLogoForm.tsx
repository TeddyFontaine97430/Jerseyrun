"use client";

import { useState } from "react";
import { useActionState } from "react";
import { updateClubLogo, type ClubLogoState } from "@/lib/actions/club-settings";
import { uploadImageClient } from "@/lib/uploadClient";

const initialState: ClubLogoState = { status: "idle" };

export function ClubLogoForm({ logoUrl, clubId }: { logoUrl: string | null; clubId?: string }) {
  const [state, formAction, pending] = useActionState(updateClubLogo, initialState);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadImageClient(file, "club-logos");
      setUploadedLogoUrl(url);
    } catch {
      setUploadError("Échec de l'envoi de l'image. Réessayez.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm sm:max-w-md">
      {clubId && <input type="hidden" name="clubId" value={clubId} />}
      <input type="hidden" name="logoUrl" value={uploadedLogoUrl} />
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-neutral-800">
          {uploadedLogoUrl || logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={uploadedLogoUrl || logoUrl || undefined} alt="Logo du club" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-neutral-500">Aucun</span>
          )}
        </div>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFileChange}
          className="w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-dark"
        />
      </div>
      <button
        type="submit"
        disabled={pending || uploading || !uploadedLogoUrl}
        className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60 sm:w-fit"
      >
        {uploading ? "Envoi de l'image..." : pending ? "Enregistrement..." : "Mettre à jour le logo"}
      </button>
      {uploadError && <p className="text-sm font-medium text-red-400">{uploadError}</p>}
      {state.status === "error" && <p className="text-sm font-medium text-red-400">{state.message}</p>}
      {state.status === "success" && <p className="text-sm font-medium text-emerald-400">{state.message}</p>}
    </form>
  );
}
