import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getClubStats, getClubSales } from "@/lib/clubStats";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/orderStatus";
import { formatSelectedOptions } from "@/lib/productOptions";
import { resetClubPassword, approveClub, rejectClub } from "@/lib/actions/admin";
import { ResetPasswordButton } from "@/components/admin/ResetPasswordButton";
import { ClubApprovalRow } from "@/components/admin/ClubApprovalRow";
import { ClubStatusToggle } from "@/components/admin/ClubStatusToggle";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const club = await prisma.club.findUnique({ where: { id } });
  return { title: club ? `${club.name} — Administration Jersey Run` : "Club introuvable" };
}

export default async function AdminClubDetailPage({ params }: Props) {
  const { id } = await params;
  const club = await prisma.club.findUnique({ where: { id }, include: { owner: true } });
  if (!club) notFound();

  const [stats, sales] = await Promise.all([getClubStats(club.id), getClubSales(club.id)]);

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
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            {club.email} · {club.phone}
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
        </div>
      </div>

      {club.status === "PENDING" && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
          <ClubApprovalRow club={club} />
        </div>
      )}

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
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((item) => (
                <tr key={item.id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 font-medium text-white">
                    {item.productName}
                    {formatSelectedOptions(item.selectedOptions) && (
                      <span className="ml-1.5 font-normal text-neutral-500">
                        ({formatSelectedOptions(item.selectedOptions)})
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
