import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { getCartForUser } from "@/lib/cart";
import { formatPrice } from "@/lib/money";
import { decodeSelectedOptions } from "@/lib/productOptions";
import { CartItemRow } from "@/components/CartItemRow";
import { CheckoutButton } from "@/components/CheckoutButton";

function availableStockFor(item: Awaited<ReturnType<typeof getCartForUser>>["items"][number]) {
  const selections = decodeSelectedOptions(item.selectedOptions);
  if (selections.length === 0) return item.product.stock;

  let available = Infinity;
  for (const sel of selections) {
    const option = item.product.options.find((o) => o.name === sel.name);
    const optionValue = option?.values.find((v) => v.value === sel.value);
    available = Math.min(available, optionValue?.stock ?? 0);
  }
  return available;
}

export const metadata: Metadata = { title: "Mon panier — Jersey Run" };

export default async function PanierPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "CUSTOMER") {
    return (
      <div className="container-page flex flex-col items-center py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Connectez-vous pour voir votre panier</h1>
        <p className="mt-2 max-w-md text-neutral-400">
          Le panier est disponible pour les clients disposant d&apos;un compte Jersey Run.
        </p>
        <Link href="/connexion?callbackUrl=/panier" className="mt-6 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white">
          Se connecter
        </Link>
      </div>
    );
  }

  const cart = await getCartForUser(session.user.id);

  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-extrabold text-white">Mon panier</h1>

      {cart.items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-white/10 bg-neutral-900 p-10 text-center shadow-sm">
          <p className="text-neutral-400">Votre panier est vide pour le moment.</p>
          <Link href="/#clubs" className="mt-4 inline-block font-semibold text-accent">
            Découvrir les boutiques des clubs →
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm lg:col-span-2">
            {cart.items.map((item) => (
              <CartItemRow
                key={item.id}
                id={item.id}
                name={item.product.name}
                clubName={item.product.club.name}
                imageUrl={item.product.imageUrl}
                priceCents={item.product.priceCents}
                quantity={item.quantity}
                stock={availableStockFor(item)}
                selectedOptions={item.selectedOptions}
              />
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-white">Récapitulatif</h2>
            <div className="mt-4 flex justify-between text-sm text-neutral-300">
              <span>Sous-total</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
            <div className="mt-2 flex justify-between text-base font-bold text-white">
              <span>Total</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
            <div className="mt-6">
              <CheckoutButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
