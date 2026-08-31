import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAllPendingOnSiteOrders } from "@/lib/clubStats";
import { formatPrice } from "@/lib/money";
import { formatItemDetails } from "@/lib/productOptions";
import { deliveryZoneLabel, formatShippingAddress } from "@/lib/delivery";
import { ClubApprovalRow } from "@/components/admin/ClubApprovalRow";
import { MarkPaidOnSiteButton } from "@/components/MarkPaidOnSiteButton";

export const metadata: Metadata = { title: { absolute: "Administration — Jersey Run" } };

export default async function AdminPage() {
  const [pendingClubs, approvedClubsCount, ordersCount, totalRevenue, customersCount, pendingOnSiteOrders] =
    await Promise.all([
      prisma.club.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } }),
      prisma.club.count({ where: { status: "APPROVED" } }),
      prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED", "PREORDER"] } } }),
      prisma.order.aggregate({
        _sum: { totalCents: true },
        where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED", "PREORDER"] } },
      }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      getAllPendingOnSiteOrders(),
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

      {pendingOnSiteOrders.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-semibold text-white">
            Commandes à encaisser sur place ({pendingOnSiteOrders.length})
          </h2>
          <div className="mt-4 space-y-4">
            {pendingOnSiteOrders.map(({ order, items }) => {
              const clubNames = [...new Set(items.map((item) => item.club.name))].join(", ");
              const phone = order.customerPhone ?? order.user?.phone;
              const email = order.customerEmail ?? order.user?.email;
              return (
                <div key={order.id} className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {order.customerName ?? order.user?.name ?? email}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {[phone, email].filter(Boolean).join(" · ")}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {clubNames} — Commande du {order.createdAt.toLocaleDateString("fr-FR")}
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
                        href={`/admin/commandes/${order.id}`}
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
              );
            })}
          </div>
        </>
      )}

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
