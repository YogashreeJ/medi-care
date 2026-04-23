import { createAdminClient } from "@/lib/supabase";
import { requireAuth, errorResponse, successResponse } from "@/lib/auth";

/**
 * GET /api/medicines
 * Query params: ?q=search&cat=category&page=1&limit=50
 * Public — no auth required.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const cat = searchParams.get("cat") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
    const offset = (page - 1) * limit;

    const supabase = createAdminClient();
    let query = supabase
      .from("medicines")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (q) {
      query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`);
    }
    if (cat && cat !== "All") {
      query = query.eq("category", cat);
    }

    const { data, error, count } = await query;
    if (error) return errorResponse(error.message, 500);

    return successResponse({ medicines: data, total: count, page, limit });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}

/**
 * POST /api/medicines
 * Admin/pharmacist only.
 * Body: { name, brand, category, price, stock, description, dosage, prescription_required }
 */
export async function POST(request) {
  try {
    const { profile, error: authError } = await requireAuth(request, ["admin", "pharmacist"]);
    if (authError) return errorResponse(authError, 403);

    const body = await request.json();
    const { name, brand, category, price, stock, description, dosage, prescription_required } = body;

    if (!name || !category || price === undefined) {
      return errorResponse("name, category, and price are required");
    }
    if (Number(price) < 0) return errorResponse("Price cannot be negative");
    if (Number(stock) < 0) return errorResponse("Stock cannot be negative");

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("medicines")
      .insert({
        name: name.trim(),
        brand: brand?.trim() || "",
        category,
        price: Number(price),
        stock: Number(stock) || 0,
        description: description?.trim() || "",
        dosage: dosage?.trim() || "",
        prescription_required: Boolean(prescription_required),
        is_active: true,
      })
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return successResponse({ medicine: data }, 201);
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}
