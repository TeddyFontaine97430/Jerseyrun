import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { NewProductPanel } from "@/components/club/NewProductPanel";
import { ProductRow } from "@/components/club/ProductRow";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const club = await prisma.club.findUnique({ where: { id } });
  return { title: { absolute: club ? `Articles ${club.name} — Administration Jersey Run` : "Club introuvable — Jersey Run" } };
}

export default async function AdminClubProductsPage({ params }: Props) {
  const { id } = await params;
  const club = await prisma.club.findUnique({ where: { id } });
  if (!club) notFound();

  const products = await prisma.product.findMany({
    where: { clubId: club.id },
    orderBy: { createdAt: "desc" },
    include: { options: { include: { values: true } } },
  });

  return (
    <div>
      <Link href={`/admin/clubs/${club.id}`} className="text-sm font-semibold text-neutral-400 hover:text-white">
        ← {club.name}
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Articles de {club.name} ({products.length})</h2>
        <NewProductPanel clubId={club.id} />
      </div>

      {products.length === 0 ? (
        <p className="mt-4 text-neutral-400">Ce club n&apos;a pas encore ajouté d&apos;articles.</p>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
          {products.map((product) => (
            <ProductRow key={product.id} product={product} clubId={club.id} />
          ))}
        </div>
      )}
    </div>
  );
}
