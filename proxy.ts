import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { authConfig } from "./auth.config";
import { routing } from "./i18n/routing";

const { auth } = NextAuth(authConfig);
const handleI18nRouting = createMiddleware(routing);

function splitLocale(pathname: string) {
  const [, maybeLocale, ...rest] = pathname.split("/");
  if ((routing.locales as readonly string[]).includes(maybeLocale)) {
    const path = `/${rest.join("/")}`.replace(/\/$/, "") || "/";
    return { locale: maybeLocale, path };
  }

  return { locale: routing.defaultLocale, path: pathname };
}

export const proxy = auth((req) => {
  const { locale, path } = splitLocale(req.nextUrl.pathname);
  const isLoggedIn = !!req.auth;

  if (!isLoggedIn && path.startsWith("/dashboard")) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.search = "";
    return Response.redirect(url);
  }

  if (isLoggedIn && (path === "/" || path === "/login")) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    url.search = "";
    return Response.redirect(url);
  }

  return handleI18nRouting(req);
});

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
