import { createAdminClient } from "@/lib/supabase";
import { errorResponse, successResponse } from "@/lib/auth";

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return errorResponse("Email and password are required");
    }

    const supabase = createAdminClient();

    const { data: sessionData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return errorResponse("Invalid email or password", 401);
    }

    const userId = sessionData.user.id;

    // Fetch profile (role, name, phone) using a fresh admin client so we don't hit RLS recursion
    // (since signInWithPassword mutates the client's session to the user's role)
    const adminSupabase = createAdminClient();
    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return errorResponse("Profile not found. Please contact support.", 404);
    }

    return successResponse({
      user: {
        id: userId,
        name: profile.name,
        email: sessionData.user.email,
        phone: profile.phone,
        role: profile.role,
      },
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_at: sessionData.session.expires_at,
      },
    });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}
