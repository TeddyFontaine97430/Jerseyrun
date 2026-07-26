import Link from "next/link";

const links = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/clubs", label: "Clubs" },
  { href: "/admin/ventes", label: "Ventes" },
  { href: "/admin/boutique-clubs", label: "Boutique clubs" },
  { href: "/admin/contenu", label: "Contenu du site" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/parametres", label: "Mon profil" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-white">Administration Jersey Run</h1>
        <nav className="flex flex-wrap gap-2 rounded-full bg-white/10 p-1.5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-neutral-300 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
