import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";

export const metadata: Metadata = { title: { absolute: "Clients — Administration Jersey Run" } };

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] as const;

export default async function AdminClientsPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: {
      orders: {
        select: { totalCents: true, status: true },
      },
    },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Clients inscrits ({customers.length})</h2>

      {customers.length === 0 ? (
        <p className="mt-4 text-neutral-400">Aucun client inscrit pour le moment.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-neutral-400">
              <tr>
                <th className="px-5 py-3 font-medium">Nom</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Téléphone</th>
                <th className="px-5 py-3 font-medium">Inscrit le</th>
                <th className="px-5 py-3 font-medium">Commandes</th>
                <th className="px-5 py-3 font-medium">Total dépensé</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                const paidOrders = customer.orders.filter((o) => PAID_STATUSES.includes(o.status as (typeof PAID_STATUSES)[number]));
                const totalSpent = paidOrders.reduce((sum, o) => sum + o.totalCents, 0);
                return (
                  <tr key={customer.id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3 font-medium text-white">{customer.name ?? "—"}</td>
                    <td className="px-5 py-3 text-neutral-300">{customer.email}</td>
                    <td className="px-5 py-3 text-neutral-300">{customer.phone ?? "—"}</td>
                    <td className="px-5 py-3 text-neutral-400">
                      {customer.createdAt.toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3 text-neutral-300">{customer.orders.length}</td>
                    <td className="px-5 py-3 text-neutral-300">{formatPrice(totalSpent)}</td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/clients/${customer.id}`} className="font-semibold text-accent hover:underline">
                        Détail →
                      </Link>
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
