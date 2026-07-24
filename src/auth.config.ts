import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
  },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.clubId = user.clubId;
        token.clubStatus = user.clubStatus;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.clubId = (token.clubId as string | null) ?? null;
        session.user.clubStatus = (token.clubStatus as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
