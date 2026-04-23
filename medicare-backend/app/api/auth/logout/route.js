import { createAdminClient } from "@/lib/supabase";
import { requireAuth, errorResponse, successResponse } from "@/lib/auth";

/**
 * POST /api/auth/logout
 * Header: Authorization: Bearer <token>
 */
export async function POST(request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return errorResponse(error, 401);

    const supabase = createAdminClient();
    await supabase.auth.admin.signOut(user.id);

    return successResponse({ message: "Logged out successfully" });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}
