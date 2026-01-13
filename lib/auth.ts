import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const member = await prisma.team.findUnique({
          where: { email: credentials.email },
        });
        if (!member || !member.password) return null;
        if (member.accessStatus !== "approved") {
          throw new Error("PENDING_REVIEW");
        }
        const stored = member.password;
        const isHash = stored.startsWith("$2");
        const ok = isHash
          ? await bcrypt.compare(credentials.password, stored)
          : credentials.password === stored;
        if (!ok) return null;

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.position,
          image: member.avatarUrl ?? null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.picture = (user as any).image ?? null;
      }

      if (token?.email) {
        const member = await prisma.team.findUnique({
          where: { email: token.email as string },
          select: { id: true, position: true, avatarUrl: true },
        });
        if (member) {
          token.id = member.id;
          token.role = member.position;
          token.picture = member.avatarUrl ?? null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id || "");
        session.user.role = (token.role as string) || "";
        session.user.image =
          (token.picture as string | null) ?? session.user.image ?? null;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
