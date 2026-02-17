import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
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
            if (account && user) {
                // Send id_token to your backend for verification
                try {
                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXTAUTH_URL
                        }/api/auth/google/verify`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${account?.id_token}`,
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
                        console.log("Backend verification successful:", resParsed);
                        token = Object.assign({}, token, {
                            id_token: account.id_token,
                            authToken: resParsed.authToken,
                            userId: resParsed.user.id,
                            role: resParsed.user.role,
                            planId: resParsed.user.billing?.planId,
                            sessionVersion: resParsed.user.sessionVersion ?? 1,
                        });
                    } else {
                        console.error("Backend verification failed:", res.status, await res.text());
                        // Fallback: use email as userId if backend verification fails
                        token = Object.assign({}, token, {
                            id_token: account.id_token,
                            userId: user.email,
                            sessionVersion: 1,
                        });
                    }
                } catch (error) {
                    console.error("Error verifying with backend:", error);
                    // Fallback: use email as userId if backend verification fails
                    token = Object.assign({}, token, {
                        id_token: account.id_token,
                        userId: user.email,
                        sessionVersion: 1,
                    });
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
                    role: (token as any).role,
                    planId: (token as any).planId,
                    sessionVersion: (token as any).sessionVersion ?? 1,
                });

                if (session.user) {
                    session.user.id = (token.userId as string) || session.user.id;
                }
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },
    pages: {
        signIn: "/",
        signOut: "/",
        error: "/",
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
};
