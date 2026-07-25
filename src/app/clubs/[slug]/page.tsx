import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";

type Props = { params: Promise<{ slug: string }> };

async function getClub(slug: string) {
  return prisma.club.findFirst({
    where: { slug, status: "APPROVED" },
    include: {
      products: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        include: { options: { include: { values: true } } },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const club = await getClub(slug);
  return { title: club ? `${club.name} — Jersey Run` : "Club introuvable — Jersey Run" };
}

export default async function ClubShopPage({ params }: Props) {
  const { slug } = await params;
  const club = await getClub(slug);
  if (!club) notFound();

  return (
    <div>
      <section className="border-b border-white/10 bg-gradient-to-b from-neutral-900 to-black">
        <div className="container-page flex flex-col items-center gap-6 py-14 text-center sm:flex-row sm:text-left">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-neutral-900">
            {club.logoUrl ? (
              <Image src={club.logoUrl} alt={club.name} width={96} height={96} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-slate-300">{club.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">{club.name}</h1>
            {club.description && <p className="mt-2 max-w-2xl text-neutral-300">{club.description}</p>}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        {!club.active ? (
          <p className="text-center text-neutral-400">
            Cette boutique est actuellement fermée. Revenez plus tard !
          </p>
        ) : club.products.length === 0 ? (
          <p className="text-center text-neutral-400">
            Ce club n&apos;a pas encore ajouté d&apos;articles à sa boutique.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {club.products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                priceCents={product.priceCents}
                imageUrl={product.imageUrl}
                stock={product.stock}
                options={product.options}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
