import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClubForUser } from "@/lib/clubStats";
import { NewProductPanel } from "@/components/club/NewProductPanel";
import { ProductRow } from "@/components/club/ProductRow";

export const metadata: Metadata = { title: { absolute: "Mes articles — Jersey Run" } };

export default async function ClubProductsPage() {
  const session = await auth();
  if (!session?.user) return null;
  const club = await getClubForUser(session.user.id);
  if (!club || club.status !== "APPROVED") return null;

  const stripeReady = club.stripeAccountId && club.stripePayoutsEnabled;

  const products = await prisma.product.findMany({
    where: { clubId: club.id },
    orderBy: { createdAt: "desc" },
    include: { options: { include: { values: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Mes articles ({products.length})</h2>
        {stripeReady && <NewProductPanel />}
      </div>

      {!stripeReady && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Vous devez d&apos;abord connecter votre compte Stripe pour pouvoir ajouter des articles.{" "}
          <Link href="/club/dashboard/parametres" className="font-semibold underline underline-offset-2">
            Connecter mon compte Stripe →
          </Link>
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-neutral-400">Vous n&apos;avez pas encore ajouté d&apos;articles.</p>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
          {products.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
