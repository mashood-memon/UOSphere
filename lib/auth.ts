import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Roll Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const identifier = credentials.identifier as string;
        const password = credentials.password as string;

        // Find user by email or roll number
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { rollNo: identifier }],
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials");
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        // Return user object (will be stored in JWT)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          rollNo: user.rollNo,
          department: user.department,
          batch: user.batch,
          profilePicUrl: user.profilePicUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rollNo = user.rollNo;
        token.department = user.department;
        token.batch = user.batch;
        token.profilePicUrl = user.profilePicUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.rollNo = token.rollNo as string;
        session.user.department = token.department as string;
        session.user.batch = token.batch as string;
        session.user.profilePicUrl = token.profilePicUrl as string | null;
      }
      return session;
    },
  },
});
