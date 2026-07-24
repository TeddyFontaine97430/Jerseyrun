import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/orderStatus";
import { formatSelectedOptions } from "@/lib/productOptions";

export const metadata: Metadata = { title: "Ventes — Administration Jersey Run" };

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] as const;

function formatAddress(order: {
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
}) {
  const parts = [
    order.shippingLine1,
    order.shippingLine2,
    [order.shippingPostalCode, order.shippingCity].filter(Boolean).join(" "),
    order.shippingCountry,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export default async function AdminVentesPage() {
  const sales = await prisma.orderItem.findMany({
    where: { order: { status: { in: [...PAID_STATUSES] } } },
    include: { order: { include: { user: true } }, club: true },
    orderBy: { order: { createdAt: "desc" } },
  });

  const totalRevenue = sales.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">
          Toutes les ventes ({sales.length} article{sales.length > 1 ? "s" : ""})
        </h2>
        <p className="text-sm text-neutral-400">
          Total : <span className="font-bold text-white">{formatPrice(totalRevenue)}</span>
        </p>
      </div>

      {sales.length === 0 ? (
        <p className="text-neutral-400">Aucune vente pour le moment.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-neutral-400">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Club</th>
                <th className="px-5 py-3 font-medium">Article</th>
                <th className="px-5 py-3 font-medium">Qté</th>
                <th className="px-5 py-3 font-medium">Montant</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Livraison</th>
                <th className="px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((item) => {
                const address = formatAddress(item.order);
                return (
                  <tr key={item.id} className="border-b border-white/5 align-top last:border-0">
                    <td className="whitespace-nowrap px-5 py-3 text-neutral-400">
                      {item.order.createdAt.toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3 font-medium text-white">{item.club.name}</td>
                    <td className="px-5 py-3 text-neutral-200">
                      {item.productName}
                      {formatSelectedOptions(item.selectedOptions) && (
                        <span className="ml-1.5 text-xs text-neutral-500">
                          ({formatSelectedOptions(item.selectedOptions)})
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-neutral-300">{item.quantity}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-neutral-300">
                      {formatPrice(item.unitPriceCents * item.quantity)}
                    </td>
                    <td className="px-5 py-3 text-neutral-300">
                      <div className="font-medium text-white">
                        {item.order.customerName ?? item.order.user.name ?? "—"}
                      </div>
                      <div className="text-xs text-neutral-500">{item.order.user.email}</div>
                      {item.order.customerPhone && (
                        <div className="text-xs text-neutral-500">{item.order.customerPhone}</div>
                      )}
                    </td>
                    <td className="max-w-[220px] px-5 py-3 text-xs text-neutral-400">
                      {address ?? <span className="italic text-slate-300">Non renseignée</span>}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          ORDER_STATUS_STYLES[item.order.status] ?? "bg-white/10 text-neutral-300"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[item.order.status] ?? item.order.status}
                      </span>
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
