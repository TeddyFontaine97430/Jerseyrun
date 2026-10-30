import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";

export function Footer() {
  return (
    <footer id="contact" className="mt-24 bg-navy text-slate-300">
      <div className="bg-accent">
        <div className="container-page flex items-center justify-center gap-2 py-4 text-center text-xs font-semibold text-white sm:text-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-5 w-5 shrink-0"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" strokeLinecap="round" />
            <circle cx="12" cy="16" r="0.5" fill="currentColor" />
          </svg>
          <span>
            Jersey Run met uniquement à disposition la plateforme aux clubs. Chaque club est responsable de son
            stock, de ses ventes et de ses clients. Toute réclamation doit se faire directement avec le club
            concerné.
          </span>
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
              <li>
                <Link href="/confidentialite" className="hover:text-accent">
                  Politique de confidentialité
                </Link>
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
          <div className="col-span-2 lg:justify-self-end">
            <a
              href="https://www.facebook.com/p/Jersey-run-cr%C3%A9ation-100082974560526/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.6c0-.9.3-1.6 1.6-1.6H16.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.4H8v3h2.5V21h3Z" />
              </svg>
              Suivez-nous sur Facebook
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} Jersey Run — La boutique officielle des clubs sportifs.
      </div>
    </footer>
  );
}
