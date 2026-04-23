import { createAdminClient } from "@/lib/supabase";
import { requireAuth, errorResponse, successResponse } from "@/lib/auth";

/**
 * GET /api/admin/users
 * Admin only — returns all registered users with their order count.
 */
export async function GET(request) {
  try {
    const { error: authError } = await requireAuth(request, ["admin"]);
    if (authError) return errorResponse(authError, 403);

    const supabase = createAdminClient();

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, name, phone, role, created_at")
      .order("created_at", { ascending: false });

    if (error) return errorResponse(error.message, 500);

    // Fetch email from auth.users and order counts
    const usersWithEmails = await Promise.all(
      profiles.map(async (profile) => {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id);
        return {
          ...profile,
          email: authUser?.user?.email || "",
          orderCount: count || 0,
        };
      })
    );

    return successResponse({ users: usersWithEmails, total: usersWithEmails.length });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}
