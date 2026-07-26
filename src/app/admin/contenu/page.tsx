import type { Metadata } from "next";
import { auth } from "@/auth";
import { getSiteContentMap } from "@/lib/siteContent";
import { SiteContentForm } from "@/components/admin/SiteContentForm";

export const metadata: Metadata = { title: "Contenu du site — Administration Jersey Run" };

export default async function AdminContentPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return <p className="text-neutral-400">Accès non autorisé.</p>;
  }

  const content = await getSiteContentMap();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Contenu du site</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Modifiez les textes et l&apos;image de la page d&apos;accueil et de la page &quot;Le concept&quot; sans
          toucher au code.
        </p>
      </div>
      <SiteContentForm content={content} />
    </div>
  );
}
