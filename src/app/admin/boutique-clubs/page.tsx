import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NewSupplyProductPanel } from "@/components/admin/NewSupplyProductPanel";
import { SupplyProductRow } from "@/components/admin/SupplyProductRow";
import { SupplyOrderCard } from "@/components/admin/SupplyOrderCard";

export const metadata: Metadata = { title: { absolute: "Boutique clubs — Administration Jersey Run" } };

export default async function AdminSupplyShopPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return <p className="text-neutral-400">Accès non autorisé.</p>;
  }

  const [products, orders, suppliers, clubs] = await Promise.all([
    prisma.supplyProduct.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.supplyOrder.findMany({
      include: {
        club: true,
        items: { include: { supplier: true, product: { select: { imageUrl: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.club.findMany({ where: { status: "APPROVED" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const clubNameById = new Map(clubs.map((club) => [club.id, club.name]));
  const productGroups = new Map<string, { label: string; products: typeof products }>();
  for (const product of products) {
    const key = product.clubId ?? "__all__";
    const label = product.clubId ? (clubNameById.get(product.clubId) ?? "Club supprimé") : "Tous les clubs (générique)";
    const group = productGroups.get(key) ?? { label, products: [] };
    group.products.push(product);
    productGroups.set(key, group);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Boutique clubs</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Ce catalogue n&apos;est visible que par les clubs. Proposez-leur des articles à commander auprès de vous.
          </p>
        </div>
        <NewSupplyProductPanel clubs={clubs} />
      </div>

      {products.length === 0 ? (
        <p className="mb-10 text-neutral-400">Aucun article dans le catalogue pour le moment.</p>
      ) : (
        <div className="mb-10 space-y-6">
          {Array.from(productGroups.values()).map((group) => (
            <div key={group.label}>
              <h4 className="mb-2 text-sm font-semibold text-neutral-300">{group.label}</h4>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
                {group.products.map((product) => (
                  <SupplyProductRow key={product.id} product={product} clubs={clubs} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="mb-4 text-lg font-semibold text-white">
        Demandes de commande des clubs ({orders.length})
      </h3>
      {suppliers.length === 0 && orders.length > 0 && (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
          Aucun fournisseur actif : ajoutez-en un dans{" "}
          <Link href="/admin/fournisseurs" className="font-semibold underline">
            la page Fournisseurs
          </Link>{" "}
          pour pouvoir router ces commandes.
        </p>
      )}
      {orders.length === 0 ? (
        <p className="text-neutral-400">Aucune demande pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <SupplyOrderCard key={order.id} order={order} suppliers={suppliers} />
          ))}
        </div>
      )}
    </div>
  );
}
