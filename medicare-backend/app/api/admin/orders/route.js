import { createAdminClient } from "@/lib/supabase";
import { requireAuth, errorResponse, successResponse } from "@/lib/auth";

/**
 * GET /api/admin/orders
 * Admin/pharmacist — returns ALL orders with customer name and items.
 * Query: ?status=Placed|Processing|Delivered|Cancelled
 */
export async function GET(request) {
  try {
    const { error: authError } = await requireAuth(request, ["admin", "pharmacist"]);
    if (authError) return errorResponse(authError, 403);

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    const supabase = createAdminClient();
    let query = supabase
      .from("orders")
      .select(`
        id, user_id, total, status, address, created_at,
        order_items ( id, medicine_name, price, quantity ),
        profiles ( name, phone )
      `)
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "All") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) return errorResponse(error.message, 500);

    return successResponse({ orders: data, total: data.length });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}

/**
 * PATCH /api/admin/orders
 * Admin/pharmacist — bulk-update a single order's status.
 * Body: { order_id, status }
 */
export async function PATCH(request) {
  try {
    const { error: authError } = await requireAuth(request, ["admin", "pharmacist"]);
    if (authError) return errorResponse(authError, 403);

    const { order_id, status } = await request.json();
    if (!order_id || !status) return errorResponse("order_id and status are required");

    const validStatuses = ["Placed", "Processing", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return errorResponse(`Invalid status. Must be: ${validStatuses.join(", ")}`);
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", order_id)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    if (!data) return errorResponse("Order not found", 404);

    return successResponse({ order: data });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}
