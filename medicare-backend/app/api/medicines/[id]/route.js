import { createAdminClient } from "@/lib/supabase";
import { requireAuth, errorResponse, successResponse } from "@/lib/auth";

/**
 * GET /api/medicines/[id]
 * Public — returns a single medicine detail.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("medicines")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error || !data) return errorResponse("Medicine not found", 404);
    return successResponse({ medicine: data });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}

/**
 * PUT /api/medicines/[id]
 * Admin/pharmacist only.
 * Body: { name, brand, category, price, stock, description, dosage, prescription_required }
 */
export async function PUT(request, { params }) {
  try {
    const { error: authError } = await requireAuth(request, ["admin", "pharmacist"]);
    if (authError) return errorResponse(authError, 403);

    const { id } = await params;
    const body = await request.json();
    const { name, brand, category, price, stock, description, dosage, prescription_required } = body;

    if (stock !== undefined && Number(stock) < 0) {
      return errorResponse("Stock cannot be negative");
    }
    if (price !== undefined && Number(price) < 0) {
      return errorResponse("Price cannot be negative");
    }

    const supabase = createAdminClient();
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (brand !== undefined) updateData.brand = brand.trim();
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = Number(price);
    if (stock !== undefined) updateData.stock = Number(stock);
    if (description !== undefined) updateData.description = description.trim();
    if (dosage !== undefined) updateData.dosage = dosage.trim();
    if (prescription_required !== undefined) updateData.prescription_required = Boolean(prescription_required);

    const { data, error } = await supabase
      .from("medicines")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    if (!data) return errorResponse("Medicine not found", 404);
    return successResponse({ medicine: data });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}

/**
 * DELETE /api/medicines/[id]
 * Admin only — soft deletes (sets is_active = false).
 */
export async function DELETE(request, { params }) {
  try {
    const { error: authError } = await requireAuth(request, ["admin"]);
    if (authError) return errorResponse(authError, 403);

    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("medicines")
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    if (!data) return errorResponse("Medicine not found", 404);
    return successResponse({ message: "Medicine deleted successfully" });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}
