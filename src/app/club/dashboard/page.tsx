import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getClubForUser, getClubStats, getClubSales, getClubPendingOnSiteOrders } from "@/lib/clubStats";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/orderStatus";
import { formatItemDetails } from "@/lib/productOptions";
import { deliveryZoneLabel, formatShippingAddress } from "@/lib/delivery";
import { DeliveryStatusToggle } from "@/components/DeliveryStatusToggle";
import { ReadyForPickupToggle } from "@/components/ReadyForPickupToggle";
import { MarkPaidOnSiteButton } from "@/components/MarkPaidOnSiteButton";

export const metadata: Metadata = { title: { absolute: "Espace club — Jersey Run" } };

export default async function ClubDashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  const club = await getClubForUser(session.user.id);
  if (!club || club.status !== "APPROVED") return null;

  const [stats, sales, pendingOnSiteOrders] = await Promise.all([
    getClubStats(club.id),
    getClubSales(club.id),
    getClubPendingOnSiteOrders(club.id),
  ]);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
          <p className="text-sm text-neutral-400">Chiffre d&apos;affaires</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{formatPrice(stats.revenueCents)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
          <p className="text-sm text-neutral-400">Articles vendus</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{stats.unitsSold}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
          <p className="text-sm text-neutral-400">Commandes</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{stats.ordersCount}</p>
        </div>
      </div>

      {pendingOnSiteOrders.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-semibold text-white">
            Commandes à encaisser sur place ({pendingOnSiteOrders.length})
          </h2>
          <div className="mt-4 space-y-4">
            {pendingOnSiteOrders.map(({ order, items }) => (
              <div key={order.id} className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {order.customerName ?? order.user?.name ?? order.user?.email}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Commande du {order.createdAt.toLocaleDateString("fr-FR")}
                    </p>
                    <p className="mt-1 text-xs font-medium text-gold">
                      {deliveryZoneLabel(order.deliveryMethod)}
                      {order.deliveryMethod !== "PICKUP" &&
                        formatShippingAddress(order) &&
                        ` — ${formatShippingAddress(order)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/club/dashboard/commandes/${order.id}`}
                      className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:border-accent hover:text-accent"
                    >
                      Modifier
                    </Link>
                    <MarkPaidOnSiteButton orderId={order.id} />
                  </div>
                </div>
                <ul className="mt-3 divide-y divide-white/10">
                  {items.map((item) => (
                    <li key={item.id} className="flex justify-between py-2 text-sm">
                      <span className="text-neutral-200">
                        {item.quantity} × {item.productName}
                        {formatItemDetails(item.selectedOptions, item.personalizationText) && (
                          <span className="ml-2 text-xs text-neutral-500">
                            — {formatItemDetails(item.selectedOptions, item.personalizationText)}
                          </span>
                        )}
                      </span>
                      <span className="font-medium text-white">
                        {formatPrice(item.unitPriceCents * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-sm font-bold text-white">
                  <span>Total à encaisser</span>
                  <span>{formatPrice(order.totalCents)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-10 text-lg font-semibold text-white">Ventes récentes</h2>
      {sales.length === 0 ? (
        <p className="mt-4 text-neutral-400">Aucune vente pour le moment.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-neutral-400">
              <tr>
                <th className="px-5 py-3 font-medium">Article</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Quantité</th>
                <th className="px-5 py-3 font-medium">Montant</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Prêt ?</th>
                <th className="px-5 py-3 font-medium">Livré</th>
                <th className="px-5 py-3 font-medium">Livraison</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((item) => (
                <tr key={item.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 font-medium text-white">
                    {item.productName}
                    {formatItemDetails(item.selectedOptions, item.personalizationText) && (
                      <span className="ml-1.5 font-normal text-neutral-500">
                        ({formatItemDetails(item.selectedOptions, item.personalizationText)})
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-neutral-300">
                    {item.order.customerName ?? item.order.user?.name ?? item.order.user?.email ?? "Vente manuelle"}
                  </td>
                  <td className="px-5 py-3 text-neutral-300">{item.quantity}</td>
                  <td className="px-5 py-3 text-neutral-300">{formatPrice(item.unitPriceCents * item.quantity)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        ORDER_STATUS_STYLES[item.order.status] ?? "bg-white/10 text-neutral-300"
                      }`}
                    >
                      {ORDER_STATUS_LABELS[item.order.status] ?? item.order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <ReadyForPickupToggle orderItemId={item.id} readyForPickup={item.readyForPickup} />
                  </td>
                  <td className="px-5 py-3">
                    <DeliveryStatusToggle orderItemId={item.id} delivered={item.delivered} />
                  </td>
                  <td className="max-w-[200px] px-5 py-3 text-xs text-neutral-400">
                    {deliveryZoneLabel(item.order.deliveryMethod)}
                    {item.order.deliveryMethod !== "PICKUP" && formatShippingAddress(item.order) && (
                      <div className="text-neutral-500">{formatShippingAddress(item.order)}</div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-neutral-400">
                    {item.order.createdAt.toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/club/dashboard/commandes/${item.orderId}`}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-neutral-300 hover:border-accent hover:text-accent"
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
