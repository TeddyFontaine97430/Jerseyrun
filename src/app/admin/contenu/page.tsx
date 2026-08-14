import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSiteContentMap } from "@/lib/siteContent";
import { SiteContentForm } from "@/components/admin/SiteContentForm";
import { HomeGalleryForm } from "@/components/admin/HomeGalleryForm";

export const metadata: Metadata = { title: { absolute: "Contenu du site — Administration Jersey Run" } };

export default async function AdminContentPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return <p className="text-neutral-400">Accès non autorisé.</p>;
  }

  const [content, galleryImages] = await Promise.all([
    getSiteContentMap(),
    prisma.homeGalleryImage.findMany({ orderBy: { position: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Contenu du site</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Modifiez les textes et l&apos;image de la page d&apos;accueil et de la page &quot;Le concept&quot; sans
          toucher au code.
        </p>
      </div>

      <div className="mb-8 rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
        <h3 className="mb-1 font-semibold text-white">Images cliquables de la page d&apos;accueil</h3>
        <p className="mb-4 text-xs text-neutral-500">
          Affichées en pleine largeur entre le bandeau d&apos;accueil et la bannière du club mis en avant. Chaque
          image a son propre lien au clic (page du site ou adresse web complète).
        </p>
        <HomeGalleryForm images={galleryImages} />
      </div>

      <SiteContentForm content={content} />
    </div>
  );
}
