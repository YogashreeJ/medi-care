import { createAdminClient } from "@/lib/supabase";
import { requireAuth, errorResponse, successResponse } from "@/lib/auth";

/**
 * GET /api/orders/[id]
 * Returns a single order with items.
 * Users can only see their own orders; admin/pharmacist can see any.
 */
export async function GET(request, { params }) {
  try {
    const { user, profile, error: authError } = await requireAuth(request);
    if (authError) return errorResponse(authError, 401);

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        id, user_id, total, status, address, created_at, updated_at,
        order_items ( id, medicine_id, medicine_name, price, quantity ),
        profiles ( name, phone )
      `)
      .eq("id", id)
      .single();

    if (error || !order) return errorResponse("Order not found", 404);

    // Users can only view their own orders
    if (profile.role === "user" && order.user_id !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    // Estimated delivery
    const eta =
      order.status === "Placed"
        ? "2-3 business days"
        : order.status === "Processing"
        ? "Tomorrow"
        : order.status === "Delivered"
        ? "Delivered"
        : "Cancelled";

    return successResponse({ order: { ...order, eta } });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}

/**
 * PATCH /api/orders/[id]
 * Admin/pharmacist only — update order status.
 * Body: { status } — "Placed" | "Processing" | "Delivered" | "Cancelled"
 */
export async function PATCH(request, { params }) {
  try {
    const { error: authError } = await requireAuth(request, ["admin", "pharmacist"]);
    if (authError) return errorResponse(authError, 403);

    const { id } = await params;
    const { status } = await request.json();

    const validStatuses = ["Placed", "Processing", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return errorResponse(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    if (!data) return errorResponse("Order not found", 404);

    return successResponse({ order: data });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}
