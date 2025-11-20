import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    id_token?: string;
    authToken?: string;
    userId?: string;
    user?: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    googleId?: string;
    authProvider?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id_token?: string;
    authToken?: string;
    userId?: string;
    myToken?: string;
  }
}
