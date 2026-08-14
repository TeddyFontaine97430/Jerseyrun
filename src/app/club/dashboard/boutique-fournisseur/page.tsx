import type { Metadata } from "next";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClubForUser } from "@/lib/clubStats";
import { formatPrice } from "@/lib/money";
import { SUPPLY_ORDER_STATUS_LABELS, SUPPLY_ORDER_STATUS_STYLES } from "@/lib/supplyOrderStatus";
import { describeSupplyOrderItemDetails } from "@/lib/supplyOrderItem";
import { SupplyOrderForm } from "@/components/club/SupplyOrderForm";

export const metadata: Metadata = { title: { absolute: "Boutique fournisseur — Jersey Run" } };

export default async function ClubSupplyShopPage() {
  const session = await auth();
  if (!session?.user) return null;
  const club = await getClubForUser(session.user.id);
  if (!club || club.status !== "APPROVED") return null;

  const [products, orders] = await Promise.all([
    prisma.supplyProduct.findMany({
      where: { active: true, OR: [{ clubId: null }, { clubId: club.id }] },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplyOrder.findMany({
      where: { clubId: club.id },
      include: { items: { include: { product: { select: { imageUrl: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Boutique fournisseur</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Commandez des articles directement auprès de l&apos;administrateur Jersey Run. Aucun paiement en ligne :
          votre demande sera traitée puis réglée séparément.
        </p>
      </div>

      {products.length === 0 ? (
        <p className="mb-10 text-neutral-400">Aucun article disponible pour le moment.</p>
      ) : (
        <div className="mb-10">
          <SupplyOrderForm products={products} />
        </div>
      )}

      <h3 className="mb-4 text-lg font-semibold text-white">Mes demandes ({orders.length})</h3>
      {orders.length === 0 ? (
        <p className="text-neutral-400">Vous n&apos;avez pas encore fait de demande.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-neutral-400">
              <tr>
                <th className="px-5 py-3 font-medium">N°</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Articles</th>
                <th className="px-5 py-3 font-medium">Montant</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">PDF</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const total = order.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
                return (
                  <tr key={order.id} className="border-b border-white/5 align-top last:border-0">
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-neutral-400">
                      {order.orderNumber ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-neutral-400">
                      {order.createdAt.toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3 text-neutral-300">
                      {Array.from(
                        order.items.reduce((groups, item) => {
                          const list = groups.get(item.productId) ?? [];
                          list.push(item);
                          groups.set(item.productId, list);
                          return groups;
                        }, new Map<string, typeof order.items>()),
                      ).map(([productId, items]) => (
                        <div key={productId} className="mb-2 flex items-start gap-2 last:mb-0">
                          {items[0].product?.imageUrl ? (
                            <Image
                              src={items[0].product.imageUrl}
                              alt={items[0].productName}
                              width={32}
                              height={32}
                              className="h-8 w-8 shrink-0 rounded-md border border-white/10 object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-neutral-800 text-sm">
                              📦
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white">{items[0].productName}</p>
                            {items.map((item) => {
                              const details = describeSupplyOrderItemDetails(item);
                              return (
                                <p key={item.id} className="text-xs text-neutral-400">
                                  {item.quantity} × {details || "sans précision"}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-neutral-300">{formatPrice(total)}</td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          SUPPLY_ORDER_STATUS_STYLES[order.status] ?? "bg-white/10 text-neutral-300"
                        }`}
                      >
                        {SUPPLY_ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <a
                        href={`/api/supply-orders/${order.id}/pdf`}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-neutral-300 hover:border-accent hover:text-accent"
                      >
                        Télécharger
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
