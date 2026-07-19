export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/admin/dashboard",
    "/admin/dashboard/:path*",
    "/admin/templates",
    "/admin/templates/:path*",
  ],
};
