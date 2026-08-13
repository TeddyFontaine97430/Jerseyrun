import Link from "next/link";
import { auth } from "@/auth";
import { getSupplierForUser } from "@/lib/supplierStats";

export default async function SupplierDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPPLIER") return null;

  const supplier = await getSupplierForUser(session.user.id);

  if (!supplier) {
    return (
      <div className="container-page py-20 text-center">
        <p className="text-neutral-400">Aucun profil fournisseur associé à ce compte.</p>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-white">{supplier.name}</h1>
        <nav className="flex gap-2 rounded-full bg-white/10 p-1.5">
          <Link
            href="/fournisseur/dashboard"
            className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-300 hover:text-white"
          >
            Mes commandes
          </Link>
          <Link
            href="/fournisseur/dashboard/parametres"
            className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-300 hover:text-white"
          >
            Paramètres
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
