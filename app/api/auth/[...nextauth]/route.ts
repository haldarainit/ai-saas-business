import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      httpOptions: {
        timeout: 40000,
      },
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        // Send id_token to your backend for verification
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXTAUTH_URL}/api/auth/google/verify`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${account?.id_token}`,
              },
              body: JSON.stringify({
                email: user?.email,
                name: user?.name,
                image: user?.image,
              }),
            }
          );
          
          if (res.ok) {
            const resParsed = await res.json();
            token = Object.assign({}, token, {
              id_token: account.id_token,
              authToken: resParsed.authToken,
              userId: resParsed.user.id,
            });
          }
        } catch (error) {
          console.error("Error verifying with backend:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session) {
        session = Object.assign({}, session, {
          id_token: token.id_token,
          authToken: token.authToken,
          userId: token.userId,
        });
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.JWT_SECRET,
});

export { handler as GET, handler as POST };
