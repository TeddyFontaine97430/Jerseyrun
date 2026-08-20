import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { ClubApprovalRow } from "@/components/admin/ClubApprovalRow";

export const metadata: Metadata = { title: { absolute: "Administration — Jersey Run" } };

export default async function AdminPage() {
  const [pendingClubs, approvedClubsCount, ordersCount, totalRevenue, customersCount] = await Promise.all([
    prisma.club.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } }),
    prisma.club.count({ where: { status: "APPROVED" } }),
    prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED", "PREORDER"] } } }),
    prisma.order.aggregate({
      _sum: { totalCents: true },
      where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED", "PREORDER"] } },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
          <p className="text-sm text-neutral-400">Clubs partenaires</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{approvedClubsCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
          <p className="text-sm text-neutral-400">Commandes payées</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{ordersCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
          <p className="text-sm text-neutral-400">Chiffre d&apos;affaires global</p>
          <p className="mt-2 text-3xl font-extrabold text-white">
            {formatPrice(totalRevenue._sum.totalCents ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
          <p className="text-sm text-neutral-400">Clients inscrits</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{customersCount}</p>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-white">
        Demandes en attente de validation ({pendingClubs.length})
      </h2>
      {pendingClubs.length === 0 ? (
        <p className="mt-4 text-neutral-400">Aucune demande en attente.</p>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
          {pendingClubs.map((club) => (
            <ClubApprovalRow key={club.id} club={club} />
          ))}
        </div>
      )}
    </div>
  );
}
