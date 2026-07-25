import type { Metadata } from "next";
import { auth } from "@/auth";
import { getClubForUser, getClubStats, getClubSales } from "@/lib/clubStats";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/orderStatus";
import { formatItemDetails } from "@/lib/productOptions";

export const metadata: Metadata = { title: "Espace club — Jersey Run" };

export default async function ClubDashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  const club = await getClubForUser(session.user.id);
  if (!club || club.status !== "APPROVED") return null;

  const [stats, sales] = await Promise.all([getClubStats(club.id), getClubSales(club.id)]);

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
                <th className="px-5 py-3 font-medium">Date</th>
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
                  <td className="px-5 py-3 text-neutral-300">{item.order.user.name ?? item.order.user.email}</td>
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
                  <td className="px-5 py-3 text-neutral-400">
                    {item.order.createdAt.toLocaleDateString("fr-FR")}
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
