import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClubForUser } from "@/lib/clubStats";
import { OrderEditor } from "@/components/orders/OrderEditor";

export const metadata: Metadata = { title: { absolute: "Commande — Espace club Jersey Run" } };

type Props = { params: Promise<{ id: string }> };

export default async function ClubOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;
  const club = await getClubForUser(session.user.id);
  if (!club || club.status !== "APPROVED") return null;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!order || !order.items.some((item) => item.clubId === club.id)) notFound();

  const products = await prisma.product.findMany({
    where: { clubId: club.id, active: true },
    include: { options: { include: { values: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <Link href="/club/dashboard" className="text-sm font-semibold text-neutral-400 hover:text-white">
        ← Retour
      </Link>
      <h2 className="mt-4 mb-6 text-lg font-semibold text-white">Modifier la commande</h2>
      <OrderEditor
        order={order}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          priceCents: p.priceCents,
          personalizationEnabled: p.personalizationEnabled,
          personalizationFeeCents: p.personalizationFeeCents,
          options: p.options,
        }))}
      />
    </div>
  );
}
