import { createAdminClient } from "@/lib/supabase";
import { requireAuth, errorResponse, successResponse } from "@/lib/auth";

/**
 * GET /api/cart
 * Returns current user's cart with medicine details.
 */
export async function GET(request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return errorResponse(authError, 401);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        quantity,
        medicine_id,
        medicines (
          id, name, brand, category, price, stock, prescription_required
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) return errorResponse(error.message, 500);

    // Flatten response for easy use in frontend
    const items = data.map((item) => ({
      cartItemId: item.id,
      medId: item.medicine_id,
      name: item.medicines.name,
      brand: item.medicines.brand,
      price: item.medicines.price,
      stock: item.medicines.stock,
      category: item.medicines.category,
      prescriptionRequired: item.medicines.prescription_required,
      qty: item.quantity,
    }));

    const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    return successResponse({ items, total, itemCount: items.reduce((s, i) => s + i.qty, 0) });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}

/**
 * POST /api/cart
 * Add a medicine to cart (or increment quantity if already exists).
 * Body: { medicine_id, quantity? }
 */
export async function POST(request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return errorResponse(authError, 401);

    const { medicine_id, quantity = 1 } = await request.json();
    if (!medicine_id) return errorResponse("medicine_id is required");
    if (quantity < 1) return errorResponse("Quantity must be at least 1");

    const supabase = createAdminClient();

    // Verify medicine exists and is in stock
    const { data: med, error: medError } = await supabase
      .from("medicines")
      .select("id, name, stock, is_active")
      .eq("id", medicine_id)
      .single();

    if (medError || !med) return errorResponse("Medicine not found", 404);
    if (!med.is_active) return errorResponse("Medicine is not available");
    if (med.stock === 0) return errorResponse("Medicine is out of stock");

    // Check if already in cart → upsert
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("medicine_id", medicine_id)
      .maybeSingle();

    let result;
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > med.stock) return errorResponse(`Only ${med.stock} units available`);
      const { data, error } = await supabase
        .from("cart_items")
        .update({ quantity: newQty })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) return errorResponse(error.message, 500);
      result = data;
    } else {
      if (quantity > med.stock) return errorResponse(`Only ${med.stock} units available`);
      const { data, error } = await supabase
        .from("cart_items")
        .insert({ user_id: user.id, medicine_id, quantity })
        .select()
        .single();
      if (error) return errorResponse(error.message, 500);
      result = data;
    }

    return successResponse({ cartItem: result }, 201);
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}

/**
 * PUT /api/cart
 * Update quantity of a cart item.
 * Body: { medicine_id, quantity } — set quantity to 0 to remove
 */
export async function PUT(request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return errorResponse(authError, 401);

    const { medicine_id, quantity } = await request.json();
    if (!medicine_id || quantity === undefined) {
      return errorResponse("medicine_id and quantity are required");
    }

    const supabase = createAdminClient();

    if (quantity <= 0) {
      // Remove item
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("medicine_id", medicine_id);
      if (error) return errorResponse(error.message, 500);
      return successResponse({ message: "Item removed from cart" });
    }

    // Validate stock
    const { data: med } = await supabase
      .from("medicines")
      .select("stock")
      .eq("id", medicine_id)
      .single();

    if (med && quantity > med.stock) {
      return errorResponse(`Only ${med.stock} units available`);
    }

    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("user_id", user.id)
      .eq("medicine_id", medicine_id)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return successResponse({ cartItem: data });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}

/**
 * DELETE /api/cart
 * Remove a specific item OR clear entire cart.
 * Body: { medicine_id? } — omit to clear entire cart
 */
export async function DELETE(request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return errorResponse(authError, 401);

    const body = await request.json().catch(() => ({}));
    const { medicine_id } = body;

    const supabase = createAdminClient();
    let query = supabase.from("cart_items").delete().eq("user_id", user.id);

    if (medicine_id) {
      query = query.eq("medicine_id", medicine_id);
    }

    const { error } = await query;
    if (error) return errorResponse(error.message, 500);

    return successResponse({ message: medicine_id ? "Item removed" : "Cart cleared" });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}
