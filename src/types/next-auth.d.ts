import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    clubId?: string | null;
    clubStatus?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      clubId: string | null;
      clubStatus: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    clubId?: string | null;
    clubStatus?: string | null;
  }
}
