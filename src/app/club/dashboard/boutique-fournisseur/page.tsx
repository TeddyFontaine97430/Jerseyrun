import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClubForUser } from "@/lib/clubStats";
import { formatPrice } from "@/lib/money";
import { SUPPLY_ORDER_STATUS_LABELS, SUPPLY_ORDER_STATUS_STYLES } from "@/lib/supplyOrderStatus";
import { SupplyOrderForm } from "@/components/club/SupplyOrderForm";

export const metadata: Metadata = { title: { absolute: "Boutique fournisseur — Jersey Run" } };

export default async function ClubSupplyShopPage() {
  const session = await auth();
  if (!session?.user) return null;
  const club = await getClubForUser(session.user.id);
  if (!club || club.status !== "APPROVED") return null;

  const [products, orders] = await Promise.all([
    prisma.supplyProduct.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } }),
    prisma.supplyOrder.findMany({
      where: { clubId: club.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Boutique fournisseur</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Commandez des articles directement auprès de l&apos;administrateur Jersey Run. Aucun paiement en ligne :
          votre demande sera traitée puis réglée séparément.
        </p>
      </div>

      {products.length === 0 ? (
        <p className="mb-10 text-neutral-400">Aucun article disponible pour le moment.</p>
      ) : (
        <div className="mb-10">
          <SupplyOrderForm products={products} />
        </div>
      )}

      <h3 className="mb-4 text-lg font-semibold text-white">Mes demandes ({orders.length})</h3>
      {orders.length === 0 ? (
        <p className="text-neutral-400">Vous n&apos;avez pas encore fait de demande.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-neutral-400">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Articles</th>
                <th className="px-5 py-3 font-medium">Montant</th>
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
                    <td className="px-5 py-3 text-neutral-300">
                      {order.items.map((item) => (
                        <p key={item.id}>
                          {item.quantity} × {item.productName}
                        </p>
                      ))}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-neutral-300">{formatPrice(total)}</td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          SUPPLY_ORDER_STATUS_STYLES[order.status] ?? "bg-white/10 text-neutral-300"
                        }`}
                      >
                        {SUPPLY_ORDER_STATUS_LABELS[order.status]}
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
