import { createAdminClient } from "@/lib/supabase";
import { errorResponse, successResponse } from "@/lib/auth";

/**
 * POST /api/auth/register
 * Body: { name, email, phone, password }
 */
export async function POST(request) {
  try {
    const { name, email, phone, password } = await request.json();

    if (!name || !email || !phone || !password) {
      return errorResponse("All fields (name, email, phone, password) are required");
    }
    if (password.length < 6) {
      return errorResponse("Password must be at least 6 characters");
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return errorResponse("Phone number must be 10 digits");
    }

    const supabase = createAdminClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm so no email verification needed
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        return errorResponse("Email is already registered", 409);
      }
      return errorResponse(authError.message, 400);
    }

    const userId = authData.user.id;

    // Insert profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      name: name.trim(),
      phone: phone.trim(),
      role: "user",
    });

    if (profileError) {
      // Rollback auth user if profile insert fails
      await supabase.auth.admin.deleteUser(userId);
      return errorResponse("Failed to create profile: " + profileError.message, 500);
    }

    // Sign in to get session tokens
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) {
      return errorResponse("Account created, but login failed: " + sessionError.message, 500);
    }

    return successResponse(
      {
        user: {
          id: userId,
          name: name.trim(),
          email,
          phone: phone.trim(),
          role: "user",
        },
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
          expires_at: sessionData.session.expires_at,
        },
      },
      201
    );
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}
