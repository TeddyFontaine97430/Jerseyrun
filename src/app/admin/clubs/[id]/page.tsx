import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getClubStats, getClubSales, getClubPendingOnSiteOrders } from "@/lib/clubStats";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/orderStatus";
import { formatItemDetails } from "@/lib/productOptions";
import { resetClubPassword, approveClub, rejectClub } from "@/lib/actions/admin";
import { ResetPasswordButton } from "@/components/admin/ResetPasswordButton";
import { ClubApprovalRow } from "@/components/admin/ClubApprovalRow";
import { ClubStatusToggle } from "@/components/admin/ClubStatusToggle";
import { DeleteClubButton } from "@/components/admin/DeleteClubButton";
import { DeliveryStatusToggle } from "@/components/DeliveryStatusToggle";
import { MarkPaidOnSiteButton } from "@/components/MarkPaidOnSiteButton";
import { ClubLogoForm } from "@/components/club/ClubLogoForm";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const club = await prisma.club.findUnique({ where: { id } });
  return { title: { absolute: club ? `${club.name} — Administration Jersey Run` : "Club introuvable — Jersey Run" } };
}

export default async function AdminClubDetailPage({ params }: Props) {
  const { id } = await params;
  const club = await prisma.club.findUnique({ where: { id }, include: { owner: true } });
  if (!club) notFound();

  const [stats, sales, pendingOnSiteOrders] = await Promise.all([
    getClubStats(club.id),
    getClubSales(club.id),
    getClubPendingOnSiteOrders(club.id),
  ]);

  return (
    <div>
      <Link href="/admin/clubs" className="text-sm font-semibold text-neutral-400 hover:text-white">
        ← Tous les clubs
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-extrabold text-white">{club.name}</h2>
            {club.status === "APPROVED" && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  club.active ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                }`}
              >
                {club.active ? "Boutique ouverte" : "Boutique fermée"}
              </span>
            )}
            {club.stripePayoutsEnabled ? (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                Paiements connectés
              </span>
            ) : (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-neutral-400">
                Paiements non connectés
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            {club.email} · {club.phone}
            {club.sport && <> · {club.sport}</>}
          </p>
          {club.description && <p className="mt-2 max-w-xl text-sm text-neutral-400">{club.description}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            href={`/admin/clubs/${club.id}/produits`}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            Gérer les articles
          </Link>
          {club.status === "APPROVED" && <ClubStatusToggle clubId={club.id} active={club.active} />}
          <ResetPasswordButton
            action={resetClubPassword.bind(null, club.id)}
            label="Réinitialiser le mot de passe du club"
          />
          <DeleteClubButton clubId={club.id} clubName={club.name} />
        </div>
      </div>

      {club.status === "PENDING" && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
          <ClubApprovalRow club={club} />
        </div>
      )}

      <h3 className="mt-10 mb-4 text-lg font-semibold text-white">Logo du club</h3>
      <ClubLogoForm logoUrl={club.logoUrl} clubId={club.id} />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
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
          <h3 className="mt-10 mb-4 text-lg font-semibold text-white">
            Commandes à encaisser sur place ({pendingOnSiteOrders.length})
          </h3>
          <div className="space-y-4">
            {pendingOnSiteOrders.map(({ order, items }) => (
              <div key={order.id} className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {order.customerName ?? order.user.name ?? order.user.email}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Commande du {order.createdAt.toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <MarkPaidOnSiteButton orderId={order.id} />
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

      <h3 className="mt-10 text-lg font-semibold text-white">Ventes</h3>
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
                <th className="px-5 py-3 font-medium">Livraison</th>
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
                  <td className="px-5 py-3">
                    <DeliveryStatusToggle orderItemId={item.id} delivered={item.delivered} />
                  </td>
                  <td className="px-5 py-3 text-neutral-400">{item.order.createdAt.toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
