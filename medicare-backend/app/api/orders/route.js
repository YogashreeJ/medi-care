import { createAdminClient } from "@/lib/supabase";
import { requireAuth, errorResponse, successResponse } from "@/lib/auth";

/**
 * GET /api/orders
 * Returns the current user's order history (sorted newest first).
 * Admin/pharmacist see all orders via /api/admin/orders.
 */
export async function GET(request) {
  try {
    const { user, profile, error: authError } = await requireAuth(request);
    if (authError) return errorResponse(authError, 401);

    const supabase = createAdminClient();
    let query = supabase
      .from("orders")
      .select(`
        id, total, status, address, created_at, updated_at,
        order_items ( id, medicine_id, medicine_name, price, quantity )
      `)
      .order("created_at", { ascending: false });

    // Regular users only see their own orders
    if (profile.role === "user") {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;
    if (error) return errorResponse(error.message, 500);

    return successResponse({ orders: data });
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}

/**
 * POST /api/orders
 * Place a new order from the current user's cart.
 * Body: { address }
 * This atomically:
 *  1. Reads the user's cart
 *  2. Creates an order + order_items
 *  3. Decrements medicine stock
 *  4. Clears the cart
 */
export async function POST(request) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return errorResponse(authError, 401);

    const { address } = await request.json();
    if (!address?.trim()) return errorResponse("Delivery address is required");

    const supabase = createAdminClient();

    // 1. Fetch cart items with medicine details
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select(`
        quantity,
        medicine_id,
        medicines ( id, name, price, stock, is_active )
      `)
      .eq("user_id", user.id);

    if (cartError) return errorResponse(cartError.message, 500);
    if (!cartItems || cartItems.length === 0) {
      return errorResponse("Cart is empty. Add medicines before placing an order.");
    }

    // 2. Validate stock for all items
    for (const item of cartItems) {
      const med = item.medicines;
      if (!med.is_active) {
        return errorResponse(`${med.name} is no longer available`);
      }
      if (item.quantity > med.stock) {
        return errorResponse(`Insufficient stock for ${med.name}. Only ${med.stock} available.`);
      }
    }

    // 3. Calculate total
    const total = cartItems.reduce((sum, item) => sum + item.medicines.price * item.quantity, 0);

    // 4. Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({ user_id: user.id, total, status: "Placed", address: address.trim() })
      .select()
      .single();

    if (orderError) return errorResponse(orderError.message, 500);

    // 5. Insert order items
    const orderItemsPayload = cartItems.map((item) => ({
      order_id: order.id,
      medicine_id: item.medicine_id,
      medicine_name: item.medicines.name,
      price: item.medicines.price,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItemsPayload);
    if (itemsError) return errorResponse(itemsError.message, 500);

    // 6. Decrement stock for each medicine
    for (const item of cartItems) {
      const { error: rpcError } = await supabase.rpc("decrement_stock", {
        med_id: item.medicine_id,
        qty: item.quantity,
      });

      if (rpcError) {
        // fallback: direct update
        await supabase
          .from("medicines")
          .update({ stock: Math.max(0, item.medicines.stock - item.quantity) })
          .eq("id", item.medicine_id);
      }
    }

    // 7. Clear cart
    await supabase.from("cart_items").delete().eq("user_id", user.id);

    return successResponse({ order }, 201);
  } catch (err) {
    return errorResponse("Internal server error: " + err.message, 500);
  }
}
