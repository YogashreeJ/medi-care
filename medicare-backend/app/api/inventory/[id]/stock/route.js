import { createAdminClient } from "@/lib/supabase";
import { requireAuth, errorResponse, successResponse } from "@/lib/auth";

/**
 * PATCH /api/inventory/[id]/stock
 * Admin/pharmacist — update stock quantity for a medicine.
 * Body: { stock } — must be >= 0
 */
export async function PATCH(request, { params }) {
  try {
    const { error: authError } = await requireAuth(request, ["admin", "pharmacist"]);
    if (authError) return errorResponse(authError, 403);

    const { id } = await params;
    const { stock } = await request.json();

    if (stock === undefined || stock === null) {
      return errorResponse("stock is required");
    }
    const stockValue = Number(stock);
    if (isNaN(stockValue) || stockValue < 0) {
      return errorResponse("Stock must be a non-negative number");
    }

    const supabase = createAdminClient();

    // Fetch current medicine to confirm it exists
    const { data: existing, error: fetchError } = await supabase
      .from("medicines")
      .select("id, name, stock")
      .eq("id", id)
      .single();

    if (fetchError || !existing) return errorResponse("Medicine not found", 404);

    const { data, error } = await supabase
      .from("medicines")
      .update({ stock: stockValue })
      .eq("id", id)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);

    return successResponse({
      medicine: data,
      message: `Stock updated from ${existing.stock} to ${stockValue} for ${existing.name}`,
    });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}
