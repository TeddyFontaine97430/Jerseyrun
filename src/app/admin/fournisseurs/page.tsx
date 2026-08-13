import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NewSupplierPanel } from "@/components/admin/NewSupplierPanel";
import { SupplierRow } from "@/components/admin/SupplierRow";

export const metadata: Metadata = { title: { absolute: "Fournisseurs — Administration Jersey Run" } };

export default async function AdminSuppliersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return <p className="text-neutral-400">Accès non autorisé.</p>;
  }

  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Fournisseurs</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Cette liste sert à choisir à qui envoyer chaque commande depuis la page « Boutique clubs ».
          </p>
        </div>
        <NewSupplierPanel />
      </div>

      {suppliers.length === 0 ? (
        <p className="text-neutral-400">Aucun fournisseur pour le moment.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-sm">
          {suppliers.map((supplier) => (
            <SupplierRow key={supplier.id} supplier={supplier} />
          ))}
        </div>
      )}
    </div>
  );
}
