import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClubForUser } from "@/lib/clubStats";
import { NewProductPanel } from "@/components/club/NewProductPanel";
import { ProductRow } from "@/components/club/ProductRow";

export const metadata: Metadata = { title: "Mes articles — Jersey Run" };

export default async function ClubProductsPage() {
  const session = await auth();
  if (!session?.user) return null;
  const club = await getClubForUser(session.user.id);
  if (!club || club.status !== "APPROVED") return null;

  const products = await prisma.product.findMany({
    where: { clubId: club.id },
    orderBy: { createdAt: "desc" },
    include: { options: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Mes articles ({products.length})</h2>
        <NewProductPanel />
      </div>

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
