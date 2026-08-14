import type { Metadata } from "next";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSupplierForUser } from "@/lib/supplierStats";
import { formatPrice } from "@/lib/money";
import { SUPPLY_ORDER_STATUS_LABELS, SUPPLY_ORDER_STATUS_STYLES } from "@/lib/supplyOrderStatus";

export const metadata: Metadata = { title: { absolute: "Espace fournisseur — Jersey Run" } };

export default async function SupplierDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPPLIER") return null;
  const supplier = await getSupplierForUser(session.user.id);
  if (!supplier) return null;

  const items = await prisma.supplyOrderItem.findMany({
    where: { supplierId: supplier.id },
    include: { order: { include: { club: true } }, product: { select: { imageUrl: true } } },
    orderBy: { sentToSupplierAt: "desc" },
  });

  const orders = new Map<string, { order: (typeof items)[number]["order"]; items: typeof items }>();
  for (const item of items) {
    const existing = orders.get(item.orderId);
    if (existing) {
      existing.items.push(item);
    } else {
      orders.set(item.orderId, { order: item.order, items: [item] });
    }
  }
  const groupedOrders = Array.from(orders.values());

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Mes commandes ({groupedOrders.length})</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Retrouvez ici les commandes que Jersey Run vous a adressées, une fois validées par l&apos;administrateur.
        </p>
      </div>

      {groupedOrders.length === 0 ? (
        <p className="text-neutral-400">Aucune commande pour le moment.</p>
      ) : (
        <div className="space-y-4">
          {groupedOrders.map(({ order, items: orderItems }) => {
            const total = orderItems.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
            return (
              <div key={order.id} className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      Commande N° {order.orderNumber ?? "—"} — {order.club.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Reçue le {order.createdAt.toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-white">{formatPrice(total)}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        SUPPLY_ORDER_STATUS_STYLES[order.status] ?? "bg-white/10 text-neutral-300"
                      }`}
                    >
                      {SUPPLY_ORDER_STATUS_LABELS[order.status]}
                    </span>
                    <a
                      href={`/api/supply-orders/${order.id}/pdf`}
                      className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:border-accent hover:text-accent"
                    >
                      Télécharger PDF
                    </a>
                  </div>
                </div>

                {order.note && (
                  <p className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-neutral-300">
                    <span className="font-semibold text-neutral-200">Remarque du club : </span>
                    {order.note}
                  </p>
                )}

                <ul className="mt-3 divide-y divide-white/10">
                  {orderItems.map((item) => {
                    const details = [item.size ? `taille ${item.size}` : null, item.personalizationText]
                      .filter(Boolean)
                      .join(" — ");
                    return (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="flex items-center gap-2 text-neutral-200">
                          {item.product?.imageUrl ? (
                            <Image
                              src={item.product.imageUrl}
                              alt={item.productName}
                              width={32}
                              height={32}
                              className="h-8 w-8 shrink-0 rounded-md border border-white/10 object-cover"
                            />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-neutral-800 text-sm">
                              📦
                            </span>
                          )}
                          {item.quantity} × {item.productName}
                          {details && <span className="ml-2 text-xs text-neutral-500">({details})</span>}
                        </span>
                        <span className="shrink-0 font-medium text-white">
                          {formatPrice(item.unitPriceCents * item.quantity)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
