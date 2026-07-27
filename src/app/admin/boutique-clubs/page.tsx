import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { SUPPLY_ORDER_STATUS_LABELS } from "@/lib/supplyOrderStatus";
import { NewSupplyProductPanel } from "@/components/admin/NewSupplyProductPanel";
import { SupplyProductRow } from "@/components/admin/SupplyProductRow";
import { SupplyOrderStatusSelect } from "@/components/admin/SupplyOrderStatusSelect";

export const metadata: Metadata = { title: { absolute: "Boutique clubs — Administration Jersey Run" } };

export default async function AdminSupplyShopPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return <p className="text-neutral-400">Accès non autorisé.</p>;
  }

  const [products, orders] = await Promise.all([
    prisma.supplyProduct.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.supplyOrder.findMany({
      include: { club: true, items: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Boutique clubs</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Ce catalogue n&apos;est visible que par les clubs. Proposez-leur des articles à commander auprès de vous.
          </p>
        </div>
        <NewSupplyProductPanel />
      </div>

      {products.length === 0 ? (
        <p className="mb-10 text-neutral-400">Aucun article dans le catalogue pour le moment.</p>
      ) : (
        <div className="mb-10 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
          {products.map((product) => (
            <SupplyProductRow key={product.id} product={product} />
          ))}
        </div>
      )}

      <h3 className="mb-4 text-lg font-semibold text-white">
        Demandes de commande des clubs ({orders.length})
      </h3>
      {orders.length === 0 ? (
        <p className="text-neutral-400">Aucune demande pour le moment.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-neutral-400">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Club</th>
                <th className="px-5 py-3 font-medium">Articles</th>
                <th className="px-5 py-3 font-medium">Montant</th>
                <th className="px-5 py-3 font-medium">Remarque</th>
                <th className="px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const total = order.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
                return (
                  <tr key={order.id} className="border-b border-white/5 align-top last:border-0">
                    <td className="whitespace-nowrap px-5 py-3 text-neutral-400">
                      {order.createdAt.toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3 font-medium text-white">{order.club.name}</td>
                    <td className="px-5 py-3 text-neutral-300">
                      {order.items.map((item) => (
                        <p key={item.id}>
                          {item.quantity} × {item.productName}
                        </p>
                      ))}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-neutral-300">{formatPrice(total)}</td>
                    <td className="max-w-[220px] px-5 py-3 text-xs text-neutral-400">
                      {order.note ?? <span className="italic text-slate-300">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <SupplyOrderStatusSelect orderId={order.id} status={order.status} />
                      <span className="sr-only">{SUPPLY_ORDER_STATUS_LABELS[order.status]}</span>
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
