import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/orderStatus";
import { formatItemDetails } from "@/lib/productOptions";
import { resetCustomerPassword } from "@/lib/actions/admin";
import { ResetPasswordButton } from "@/components/admin/ResetPasswordButton";

type Props = { params: Promise<{ id: string }> };

function formatAddress(order: {
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
}) {
  const parts = [
    order.shippingLine1,
    order.shippingLine2,
    [order.shippingPostalCode, order.shippingCity].filter(Boolean).join(" "),
    order.shippingCountry,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const customer = await prisma.user.findUnique({ where: { id } });
  return {
    title: {
      absolute: customer
        ? `${customer.name ?? customer.email} — Administration Jersey Run`
        : "Client introuvable — Jersey Run",
    },
  };
}

export default async function AdminClientDetailPage({ params }: Props) {
  const { id } = await params;
  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        include: { items: { include: { club: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer || customer.role !== "CUSTOMER") notFound();

  return (
    <div>
      <Link href="/admin/clients" className="text-sm font-semibold text-neutral-400 hover:text-white">
        ← Tous les clients
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">{customer.name ?? customer.email}</h2>
          <p className="mt-1 text-sm text-neutral-400">
            {customer.email}
            {customer.phone && <span className="ml-2">· {customer.phone}</span>}
          </p>
          <p className="text-xs text-neutral-500">
            Inscrit le {customer.createdAt.toLocaleDateString("fr-FR")}
          </p>
        </div>
        <ResetPasswordButton
          action={resetCustomerPassword.bind(null, customer.id)}
          label="Réinitialiser le mot de passe"
        />
      </div>

      <h3 className="mt-8 text-lg font-semibold text-white">
        Commandes ({customer.orders.length})
      </h3>

      {customer.orders.length === 0 ? (
        <p className="mt-4 text-neutral-400">Aucune commande passée.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {customer.orders.map((order) => {
            const address = formatAddress(order);
            return (
              <div key={order.id} className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-neutral-400">
                      Commande du {order.createdAt.toLocaleDateString("fr-FR")}
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

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-sm">
                  <div className="text-xs text-neutral-400">
                    {order.customerName && <p className="font-medium text-neutral-300">{order.customerName}</p>}
                    {order.customerPhone && <p>{order.customerPhone}</p>}
                    {address ? <p>{address}</p> : <p className="italic text-slate-300">Adresse non renseignée</p>}
                  </div>
                  <div className="font-bold text-white">Total : {formatPrice(order.totalCents)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
