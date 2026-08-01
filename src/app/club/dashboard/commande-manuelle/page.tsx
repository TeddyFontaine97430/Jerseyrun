import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClubForUser } from "@/lib/clubStats";
import { ManualOrderForm } from "@/components/club/ManualOrderForm";

export const metadata: Metadata = { title: { absolute: "Commande manuelle — Espace club Jersey Run" } };

export default async function ClubManualOrderPage() {
  const session = await auth();
  if (!session?.user) return null;
  const club = await getClubForUser(session.user.id);
  if (!club || club.status !== "APPROVED") return null;

  const products = await prisma.product.findMany({
    where: { clubId: club.id, active: true },
    orderBy: { name: "asc" },
    include: { options: { include: { values: true } } },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Enregistrer une vente manuelle</h2>
      <p className="mt-1 max-w-lg text-sm text-neutral-400">
        Utilisez ce formulaire pour enregistrer une vente réalisée en direct (lors d&apos;un entraînement, d&apos;un
        événement...) sans passer par le site. La vente est immédiatement marquée comme payée, le stock est mis à
        jour, et une facture numérotée est générée.
      </p>
      <div className="mt-6">
        <ManualOrderForm
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            priceCents: p.priceCents,
            options: p.options.map((o) => ({
              id: o.id,
              name: o.name,
              values: o.values.map((v) => ({ value: v.value, stock: v.stock })),
            })),
            personalizationEnabled: p.personalizationEnabled,
            personalizationFeeCents: p.personalizationFeeCents,
          }))}
        />
      </div>
    </div>
  );
}
