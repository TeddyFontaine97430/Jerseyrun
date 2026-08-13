"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/money";
import { sendSupplyOrderGroupToSupplier } from "@/lib/actions/supply";
import { SupplyOrderStatusSelect } from "@/components/admin/SupplyOrderStatusSelect";
import type { SupplyOrderStatus } from "@prisma/client";

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  size: string | null;
  personalizationText: string | null;
  supplierId: string | null;
  sentToSupplierAt: Date | null;
  supplier: { id: string; name: string } | null;
};

type Order = {
  id: string;
  orderNumber: string | null;
  createdAt: Date;
  note: string | null;
  status: SupplyOrderStatus;
  club: { name: string };
  items: OrderItem[];
};

function describeLine(item: OrderItem): string {
  const details = [item.size ? `taille ${item.size}` : null, item.personalizationText].filter(Boolean).join(" — ");
  return `${item.quantity} × ${details || "sans précision"}`;
}

function ProductGroup({ orderId, productId, productName, items, suppliers }: {
  orderId: string;
  productId: string;
  productName: string;
  items: OrderItem[];
  suppliers: { id: string; name: string }[];
}) {
  const alreadySent = items.every((item) => item.supplierId && item.sentToSupplierAt);
  const sentTo = alreadySent ? items[0].supplier : null;
  const sentAt = alreadySent ? items[0].sentToSupplierAt : null;

  const [supplierId, setSupplierId] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0),
    [items],
  );

  async function handleSend() {
    if (!supplierId) return;
    setPending(true);
    setMessage(null);
    const result = await sendSupplyOrderGroupToSupplier(orderId, productId, supplierId);
    setPending(false);
    setMessage({ type: result.status === "success" ? "success" : "error", text: result.message });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-800/50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">{productName}</p>
          <ul className="mt-1 space-y-0.5 text-xs text-neutral-400">
            {items.map((item) => (
              <li key={item.id}>{describeLine(item)}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs font-medium text-neutral-300">{formatPrice(subtotal)}</p>
      </div>

      <div className="mt-2.5">
        {sentTo && sentAt ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              Envoyé à {sentTo.name} le {sentAt.toLocaleDateString("fr-FR")}
            </span>
            <button
              type="button"
              onClick={() => {
                setSupplierId("");
                setMessage(null);
              }}
              className="text-xs font-medium text-neutral-400 underline hover:text-white"
            >
              Renvoyer / changer
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="rounded-lg border border-white/10 bg-neutral-900 px-2.5 py-1.5 text-xs text-white focus:border-accent focus:outline-none"
            >
              <option value="">Choisir un fournisseur...</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!supplierId || pending}
              onClick={handleSend}
              className="rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-dark disabled:opacity-50"
            >
              {pending ? "Envoi..." : "Envoyer au fournisseur"}
            </button>
          </div>
        )}
        {message && (
          <p className={`mt-1.5 text-xs font-medium ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}

export function SupplyOrderCard({ order, suppliers }: { order: Order; suppliers: { id: string; name: string }[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, OrderItem[]>();
    for (const item of order.items) {
      const list = map.get(item.productId) ?? [];
      list.push(item);
      map.set(item.productId, list);
    }
    return Array.from(map.entries());
  }, [order.items]);

  const total = order.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-white">
            {order.club.name} <span className="font-mono text-xs text-neutral-500">N° {order.orderNumber ?? "—"}</span>
          </p>
          <p className="text-xs text-neutral-500">{order.createdAt.toLocaleDateString("fr-FR")}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-white">{formatPrice(total)}</p>
          <SupplyOrderStatusSelect orderId={order.id} status={order.status} />
          <a
            href={`/api/supply-orders/${order.id}/pdf`}
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-neutral-300 hover:border-accent hover:text-accent"
          >
            PDF
          </a>
        </div>
      </div>

      {order.note && (
        <p className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-neutral-300">
          <span className="font-semibold text-neutral-200">Remarque du club : </span>
          {order.note}
        </p>
      )}

      <div className="mt-3 space-y-2.5">
        {groups.map(([productId, items]) => (
          <ProductGroup
            key={productId}
            orderId={order.id}
            productId={productId}
            productName={items[0].productName}
            items={items}
            suppliers={suppliers}
          />
        ))}
      </div>
    </div>
  );
}
