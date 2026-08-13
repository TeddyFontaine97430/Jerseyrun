import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OrderEditor } from "@/components/orders/OrderEditor";

export const metadata: Metadata = { title: { absolute: "Commande — Administration Jersey Run" } };

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return <p className="text-neutral-400">Accès non autorisé.</p>;
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!order) notFound();

  const clubId = order.items[0]?.clubId;
  const products = clubId
    ? await prisma.product.findMany({
        where: { clubId, active: true },
        include: { options: { include: { values: true } } },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div>
      <Link href="/admin/ventes" className="text-sm font-semibold text-neutral-400 hover:text-white">
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
