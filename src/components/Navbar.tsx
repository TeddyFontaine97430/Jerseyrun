import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/auth";
import { getCartForUser } from "@/lib/cart";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/concept", label: "Concept" },
];

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  let cartCount = 0;
  if (user?.role === "CUSTOMER") {
    const cart = await getCartForUser(user.id);
    cartCount = cart.count;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-900/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="Jersey Run" width={975} height={863} priority className="h-12 w-auto" />
        </Link>

        <input id="nav-toggle" type="checkbox" className="peer hidden" />

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-neutral-300 transition hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!user && (
            <>
              <Link
                href="/connexion"
                className="text-sm font-medium text-neutral-300 hover:text-accent"
              >
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark"
              >
                Créer un compte
              </Link>
            </>
          )}

          {user?.role === "CUSTOMER" && (
            <>
              <Link
                href="/panier"
                className="relative text-sm font-medium text-neutral-300 hover:text-accent"
              >
                Panier
                {cartCount > 0 && (
                  <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                href="/compte"
                className="text-sm font-medium text-neutral-300 hover:text-accent"
              >
                Mon compte
              </Link>
            </>
          )}

          {user?.role === "CLUB" && (
            <Link
              href="/club/dashboard"
              className="text-sm font-medium text-neutral-300 hover:text-accent"
            >
              Espace club
            </Link>
          )}

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-sm font-medium text-neutral-300 hover:text-accent"
            >
              Administration
            </Link>
          )}

          {user && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:border-accent hover:text-accent"
              >
                Déconnexion
              </button>
            </form>
          )}
        </div>

        <label
          htmlFor="nav-toggle"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 md:hidden"
          aria-label="Ouvrir le menu"
        >
          <span className="block h-0.5 w-5 bg-white before:absolute before:-mt-2 before:block before:h-0.5 before:w-5 before:bg-white after:absolute after:mt-2 after:block after:h-0.5 after:w-5 after:bg-white" />
        </label>

        <div className="fixed inset-x-0 top-16 hidden max-h-0 flex-col gap-1 overflow-hidden border-b border-white/10 bg-neutral-900 px-5 py-0 shadow-lg transition-all peer-checked:flex peer-checked:max-h-[28rem] peer-checked:py-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-white/5 hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
          <hr className="my-2 border-white/10" />
          {!user && (
            <>
              <Link href="/connexion" className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-white/5">
                Connexion
              </Link>
              <Link href="/inscription" className="rounded-lg px-3 py-2 text-sm font-semibold text-accent hover:bg-white/5">
                Créer un compte
              </Link>
            </>
          )}
          {user?.role === "CUSTOMER" && (
            <>
              <Link href="/panier" className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-white/5">
                Panier {cartCount > 0 ? `(${cartCount})` : ""}
              </Link>
              <Link href="/compte" className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-white/5">
                Mon compte
              </Link>
            </>
          )}
          {user?.role === "CLUB" && (
            <Link href="/club/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-white/5">
              Espace club
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-white/5">
              Administration
            </Link>
          )}
          {user && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-300 hover:bg-white/5">
                Déconnexion
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
