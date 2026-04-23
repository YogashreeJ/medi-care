import { createAdminClient } from "./supabase";

/**
 * Extracts and validates the Bearer token from a Next.js Request.
 * Returns { user, profile, error }
 *
 * @param {Request} request - Next.js App Router request object
 * @param {string[]} [allowedRoles] - If provided, checks that profile.role is in this list
 */
export async function requireAuth(request, allowedRoles = null) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return { user: null, profile: null, error: "Unauthorized: No token provided" };
  }

  const supabase = createAdminClient();

  // Verify JWT with Supabase
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { user: null, profile: null, error: "Unauthorized: Invalid or expired token" };
  }

  // Fetch profile (role, name, phone)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { user, profile: null, error: "Unauthorized: Profile not found" };
  }

  // Role-based access
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return {
      user,
      profile,
      error: `Forbidden: Requires role ${allowedRoles.join(" or ")}`,
    };
  }

  return { user, profile, error: null };
}

/**
 * Standardised JSON error response helper
 */
export function errorResponse(message, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

/**
 * Standardised JSON success response helper
 */
export function successResponse(data, status = 200) {
  return Response.json({ success: true, ...data }, { status });
}
