import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";

export function Footer() {
  return (
    <footer id="contact" className="mt-24 bg-navy text-slate-300">
      <div className="border-b border-white/10 bg-black/30">
        <div className="container-page py-5 text-center text-xs text-neutral-400 sm:text-sm">
          Jersey Run met uniquement à disposition la plateforme aux clubs. Chaque club est responsable de son
          stock, de ses ventes et de ses clients. Toute réclamation doit se faire directement avec le club
          concerné.
        </div>
      </div>
      <div className="container-page grid gap-12 py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold text-white">Une question ? Contactez-nous</h2>
          <p className="mt-2 max-w-md text-sm text-neutral-500">
            Que vous soyez un club souhaitant rejoindre Jersey Run ou un
            supporter avec une question, écrivez-nous.
          </p>
          <div className="mt-8">
            <ContactForm />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 lg:justify-items-end">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
              Jersey Run
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-accent">Accueil</Link>
              </li>
              <li>
                <Link href="/concept" className="hover:text-accent">Le concept</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
              Comptes
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/inscription" className="hover:text-accent">Créer un compte</Link>
              </li>
              <li>
                <Link href="/connexion" className="hover:text-accent">Connexion</Link>
              </li>
              <li>
                <Link href="/concept?tab=inscription" className="hover:text-accent">
                  Inscription club
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} Jersey Run — La boutique officielle des clubs sportifs.
      </div>
    </footer>
  );
}
