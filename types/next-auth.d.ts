import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rollNo: string;
      department: string;
      batch: string;
      profilePicUrl: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    rollNo?: string;
    department?: string;
    batch?: string;
    profilePicUrl?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rollNo: string;
    department: string;
    batch: string;
    profilePicUrl: string | null;
  }
}
