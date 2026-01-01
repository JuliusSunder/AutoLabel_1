import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          return null;
        }

        // Check if user has a password (not OAuth-only)
        if (!user.password) {
          return null;
        }

        // Check if email is verified FIRST - before password check
        // This way we show a helpful message even if password is wrong
        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // For OAuth providers, automatically verify email
        if (account?.provider === "google") {
          console.log("[Auth] Google OAuth sign-in attempt", { email: user.email });
          
          if (user.email) {
            // Check if user exists first
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email },
            });

            if (existingUser) {
              // Update existing user to verify email
              await prisma.user.update({
                where: { email: user.email },
                data: { emailVerified: new Date() },
              });
              console.log("[Auth] Verified existing Google user", { email: user.email });
            } else {
              // For new users, the adapter will create them
              // Email will be verified in the createUser event
              console.log("[Auth] New Google user will be created", { email: user.email });
            }
          }
          return true;
        }
        
        // For credentials, the email verification is already checked in authorize()
        // No need to check again here to avoid race conditions
        if (account?.provider === "credentials") {
          console.log("[Auth] Credentials sign-in successful", { email: user.email });
          return true;
        }
        
        return true;
      } catch (error) {
        console.error("[Auth] Sign-in callback error:", error);
        // Return false to prevent sign-in on error
        return false;
      }
    },
    async jwt({ token, user, account, trigger }) {
      try {
        // On initial sign-in, user object is available
        if (user) {
          token.id = user.id;
          token.emailVerified = user.emailVerified;
          console.log("[Auth] JWT created", { userId: user.id, email: user.email });
        }
        
        // On subsequent requests, fetch fresh user data if needed
        if (trigger === "update") {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
          });
          if (dbUser) {
            token.emailVerified = dbUser.emailVerified;
          }
        }
        
        return token;
      } catch (error) {
        console.error("[Auth] JWT callback error:", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session.user && token) {
          session.user.id = token.id as string;
          session.user.emailVerified = token.emailVerified as Date | null;
        }
        return session;
      } catch (error) {
        console.error("[Auth] Session callback error:", error);
        return session;
      }
    },
  },
  events: {
    async createUser({ user }) {
      try {
        console.log("[Auth] Creating new user", { email: user.email });
        
        // Create free subscription for new users
        await prisma.subscription.create({
          data: {
            userId: user.id,
            stripeCustomerId: null,
            status: "active",
            plan: "free",
          },
        });
        
        // For OAuth users, automatically verify email
        // This handles the case where the user is created via OAuth
        if (user.email && !user.emailVerified) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
          console.log("[Auth] Auto-verified OAuth user email", { email: user.email });
        }
        
        console.log("[Auth] User created successfully", { userId: user.id });
      } catch (error) {
        console.error("[Auth] Create user event error:", error);
        // Don't throw - let the user be created even if subscription fails
      }
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

