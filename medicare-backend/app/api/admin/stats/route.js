import { createAdminClient } from "@/lib/supabase";
import { requireAuth, errorResponse, successResponse } from "@/lib/auth";

/**
 * GET /api/admin/stats
 * Admin/pharmacist — dashboard statistics.
 */
export async function GET(request) {
  try {
    const { error: authError } = await requireAuth(request, ["admin", "pharmacist"]);
    if (authError) return errorResponse(authError, 403);

    const supabase = createAdminClient();

    // Run all stat queries in parallel
    const [
      { count: userCount },
      { count: orderCount },
      { count: medicineCount },
      { count: lowStockCount },
      { data: recentOrders },
      { data: lowStockItems },
      { data: ordersByStatus },
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("medicines").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("medicines").select("id", { count: "exact", head: true }).eq("is_active", true).lte("stock", 15),
      supabase
        .from("orders")
        .select("id, total, status, created_at, profiles(name)")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("medicines")
        .select("id, name, category, stock")
        .eq("is_active", true)
        .lte("stock", 15)
        .order("stock", { ascending: true }),
      supabase
        .from("orders")
        .select("status"),
    ]);

    // Count orders by status
    const statusCounts = { Placed: 0, Processing: 0, Delivered: 0, Cancelled: 0 };
    if (ordersByStatus) {
      ordersByStatus.forEach((o) => {
        if (statusCounts[o.status] !== undefined) statusCounts[o.status]++;
      });
    }

    return successResponse({
      stats: {
        totalUsers: userCount || 0,
        totalOrders: orderCount || 0,
        totalMedicines: medicineCount || 0,
        lowStockCount: lowStockCount || 0,
        ordersByStatus: statusCounts,
      },
      recentOrders: recentOrders || [],
      lowStockAlerts: lowStockItems || [],
    });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}
