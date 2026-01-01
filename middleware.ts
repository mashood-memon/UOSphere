export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/home/:path*",
    "/profile/:path*",
    "/discover/:path*",
    "/communities/:path*",
    "/messages/:path*",
  ],
};
