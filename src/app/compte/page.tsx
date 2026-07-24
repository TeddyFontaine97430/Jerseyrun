import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/orderStatus";
import { formatSelectedOptions } from "@/lib/productOptions";

export const metadata: Metadata = { title: "Mon compte — Jersey Run" };

export default async function ComptePage() {
  const session = await auth();
  if (!session?.user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: { include: { club: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-extrabold text-white">Mon compte</h1>
      <p className="mt-1 text-neutral-400">
        Connecté en tant que <span className="font-medium text-white">{session.user.email}</span>
      </p>

      <h2 className="mt-10 text-xl font-semibold text-white">Mes commandes</h2>

      {orders.length === 0 ? (
        <p className="mt-4 text-neutral-400">Vous n&apos;avez pas encore passé de commande.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-neutral-400">
                    Commande du{" "}
                    {order.createdAt.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-neutral-500">#{order.id.slice(-8)}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    ORDER_STATUS_STYLES[order.status] ?? "bg-white/10 text-neutral-300"
                  }`}
                >
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
              <ul className="mt-4 divide-y divide-white/10">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between py-2 text-sm">
                    <span className="text-neutral-200">
                      {item.quantity} × {item.productName}
                      <span className="ml-2 text-xs text-neutral-500">({item.club.name})</span>
                      {formatSelectedOptions(item.selectedOptions) && (
                        <span className="ml-2 text-xs text-neutral-500">
                          — {formatSelectedOptions(item.selectedOptions)}
                        </span>
                      )}
                    </span>
                    <span className="font-medium text-white">
                      {formatPrice(item.unitPriceCents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-end border-t border-white/10 pt-3 text-sm font-bold text-white">
                Total : {formatPrice(order.totalCents)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
