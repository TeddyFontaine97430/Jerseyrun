"use client";

import { useActionState, useState } from "react";
import { sendPushNotification, type SendPushFormState } from "@/lib/actions/pushNotifications";
import { uploadImageClient } from "@/lib/uploadClient";

const initialState: SendPushFormState = { status: "idle" };

export function PushNotificationForm({ deviceCount }: { deviceCount: number }) {
  const [state, formAction, pending] = useActionState(sendPushNotification, initialState);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadImageClient(file, "push-notifications");
      setImageUrl(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Échec de l'envoi de l'image. Réessayez.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      action={(formData) => {
        formAction(formData);
      }}
      className="space-y-6"
    >
      <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
        <p className="mb-4 text-sm text-neutral-400">
          {deviceCount === 0 ? (
            "Aucun appareil n'a encore installé l'app."
          ) : (
            <>
              <span className="font-semibold text-white">{deviceCount}</span> appareil
              {deviceCount > 1 ? "s" : ""} recevr{deviceCount > 1 ? "ont" : "a"} cette notification.
            </>
          )}
        </p>
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white">Titre</label>
            <input
              name="title"
              required
              maxLength={65}
              placeholder="Nouvelle collection disponible !"
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white">Message</label>
            <textarea
              name="body"
              required
              rows={3}
              maxLength={240}
              placeholder="Découvrez les nouveaux maillots de votre club préféré, dès maintenant sur Jersey Run."
              className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white placeholder:text-neutral-500 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-white">Image (facultatif)</label>
            <input type="hidden" name="imageUrl" value={imageUrl} />
            <div className="flex items-center gap-3">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="h-14 w-24 shrink-0 rounded-lg border border-white/10 object-cover"
                />
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileChange}
                className="w-full text-sm text-neutral-300 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-dark"
              />
            </div>
            {uploading && <p className="mt-1 text-xs text-neutral-400">Envoi de l&apos;image...</p>}
            {uploadError && <p className="mt-1 text-xs text-red-400">{uploadError}</p>}
            <p className="mt-1 text-xs text-neutral-500">
              Affichée en grand dans la notification sur Android. Sur iOS, nécessite une configuration
              supplémentaire (à venir avec le compte Apple Developer).
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending || uploading || deviceCount === 0}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60"
        >
          {uploading ? "Envoi de l'image..." : pending ? "Envoi en cours..." : "Envoyer la notification"}
        </button>
        {state.status === "success" && <p className="text-sm font-medium text-emerald-400">{state.message}</p>}
        {state.status === "error" && <p className="text-sm font-medium text-red-400">{state.message}</p>}
      </div>
    </form>
  );
}
