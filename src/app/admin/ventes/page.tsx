import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/orderStatus";
import { formatItemDetails } from "@/lib/productOptions";
import { deliveryZoneLabel, formatShippingAddress } from "@/lib/delivery";
import { DeliveryStatusToggle } from "@/components/DeliveryStatusToggle";
import { ReadyForPickupToggle } from "@/components/ReadyForPickupToggle";

export const metadata: Metadata = { title: { absolute: "Ventes — Administration Jersey Run" } };

const PAID_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "COMPLETED", "PREORDER"] as const;

export default async function AdminVentesPage() {
  const sales = await prisma.orderItem.findMany({
    where: { order: { status: { in: [...PAID_STATUSES] } } },
    include: {
      order: { include: { user: true } },
      club: true,
      product: { select: { imageUrl: true, images: { orderBy: { position: "asc" }, take: 1, select: { url: true } } } },
    },
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
                <th className="px-5 py-3 font-medium">Prêt ?</th>
                <th className="px-5 py-3 font-medium">Livré</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((item) => {
                const address = formatShippingAddress(item.order);
                return (
                  <tr key={item.id} className="border-b border-white/5 align-top last:border-0">
                    <td className="whitespace-nowrap px-5 py-3 text-neutral-400">
                      {item.order.createdAt.toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3 font-medium text-white">{item.club.name}</td>
                    <td className="px-5 py-3 text-neutral-200">
                      <div className="flex items-center gap-2.5">
                        {(() => {
                          const imageUrl = item.product.images[0]?.url ?? item.product.imageUrl;
                          return imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt=""
                              width={36}
                              height={36}
                              className="h-9 w-9 shrink-0 rounded-lg border border-white/10 object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-neutral-800 text-base">
                              📦
                            </div>
                          );
                        })()}
                        <span>
                          {item.productName}
                          {formatItemDetails(item.selectedOptions, item.personalizationText) && (
                            <span className="ml-1.5 text-xs text-neutral-500">
                              ({formatItemDetails(item.selectedOptions, item.personalizationText)})
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-300">{item.quantity}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-neutral-300">
                      {formatPrice(item.unitPriceCents * item.quantity)}
                    </td>
                    <td className="px-5 py-3 text-neutral-300">
                      <div className="font-medium text-white">
                        {item.order.customerName ?? item.order.user?.name ?? "—"}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {item.order.user?.email ?? item.order.customerEmail ?? "Vente manuelle"}
                      </div>
                      {item.order.customerPhone && (
                        <div className="text-xs text-neutral-500">{item.order.customerPhone}</div>
                      )}
                    </td>
                    <td className="max-w-[220px] px-5 py-3 text-xs text-neutral-400">
                      <div className="font-medium text-neutral-300">{deliveryZoneLabel(item.order.deliveryMethod)}</div>
                      {item.order.deliveryMethod !== "PICKUP" &&
                        (address ?? <span className="italic text-slate-300">Adresse non renseignée</span>)}
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
                    <td className="whitespace-nowrap px-5 py-3">
                      <ReadyForPickupToggle orderItemId={item.id} readyForPickup={item.readyForPickup} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <DeliveryStatusToggle orderItemId={item.id} delivered={item.delivered} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <Link
                        href={`/admin/commandes/${item.orderId}`}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-neutral-300 hover:border-accent hover:text-accent"
                      >
                        Modifier
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
