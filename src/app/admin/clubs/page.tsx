import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Clubs — Administration Jersey Run" };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Validé",
  REJECTED: "Refusé",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-300",
  APPROVED: "bg-emerald-500/15 text-emerald-300",
  REJECTED: "bg-red-500/15 text-red-300",
};

export default async function AdminClubsPage() {
  const clubs = await prisma.club.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-white">Tous les clubs ({clubs.length})</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-neutral-400">
            <tr>
              <th className="px-5 py-3 font-medium">Club</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Téléphone</th>
              <th className="px-5 py-3 font-medium">Articles</th>
              <th className="px-5 py-3 font-medium">Statut</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {clubs.map((club) => (
              <tr key={club.id} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-3 font-medium text-white">{club.name}</td>
                <td className="px-5 py-3 text-neutral-300">{club.email}</td>
                <td className="px-5 py-3 text-neutral-300">{club.phone}</td>
                <td className="px-5 py-3 text-neutral-300">{club._count.products}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[club.status]}`}>
                    {STATUS_LABELS[club.status]}
                  </span>
                  {club.status === "APPROVED" && !club.active && (
                    <span className="ml-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-300">
                      Fermée
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <Link href={`/admin/clubs/${club.id}`} className="font-semibold text-accent hover:underline">
                    Gérer →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
