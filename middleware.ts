import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  principal: "/principal",
  teacher: "/teacher",
  helping_staff: "/helping-staff",
  parent: "/parent",
};

const ROLE_PREFIX: Record<string, string> = {
  admin: "/admin",
  principal: "/principal",
  teacher: "/teacher",
  helping_staff: "/helping-staff",
  parent: "/parent",
};

function defaultHome(role: string | null) {
  return ROLE_HOME[role || ""] || "/login";
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Unauthenticated users → login (allow /login, /set-password through)
  if (!user && path !== "/login" && path !== "/set-password") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Root path → redirect to role dashboard
  if (user && path === "/") {
    const { data: staff } = await supabase
      .from("staff").select("role").eq("user_id", user.id).eq("status", "active").single();
    return NextResponse.redirect(new URL(defaultHome(staff?.role), request.url));
  }

  // Authenticated users hitting login → role dashboard
  if (user && path === "/login") {
    const { data: staff } = await supabase
      .from("staff").select("role").eq("user_id", user.id).eq("status", "active").single();
    return NextResponse.redirect(new URL(defaultHome(staff?.role), request.url));
  }

  // Check must_change_password for logged-in users (skip /set-password and /login)
  if (user && path !== "/set-password" && path !== "/login") {
    const { data: staff } = await supabase
      .from("staff")
      .select("must_change_password")
      .eq("user_id", user.id)
      .single();
    if (staff?.must_change_password === true) {
      return NextResponse.redirect(new URL("/set-password", request.url));
    }
  }

  // Users on /set-password who don't need it → role dashboard
  if (user && path === "/set-password") {
    const { data: staff } = await supabase
      .from("staff")
      .select("must_change_password, role")
      .eq("user_id", user.id)
      .single();
    if (staff?.must_change_password !== true) {
      return NextResponse.redirect(new URL(defaultHome(staff?.role), request.url));
    }
  }

  // Role-based route protection: if logged-in user hits a role-prefixed route
  // that doesn't match their role, redirect them to their own dashboard
  if (user && !["/login", "/set-password"].includes(path)) {
    const { data: staff } = await supabase
      .from("staff")
      .select("role")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();
    const role = staff?.role;
    if (role) {
      const allowedPrefix = ROLE_PREFIX[role];
      // Check if path starts with any role prefix (but not the user's own)
      for (const [otherRole, prefix] of Object.entries(ROLE_PREFIX)) {
        if (otherRole !== role && (path === prefix || path.startsWith(prefix + "/"))) {
          return NextResponse.redirect(new URL(allowedPrefix, request.url));
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
