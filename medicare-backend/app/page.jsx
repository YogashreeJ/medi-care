"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
// useCallback is used in CartPage, MedicinesPage, AdminOrdersPage

// ─── API Helper ───────────────────────────────────────────────────────────────
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("medicare_token");
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ─── Auth Context ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("medicare_user");
    const token = localStorage.getItem("medicare_token");
    if (stored && token) {
      try { setCurrentUser(JSON.parse(stored)); } catch {}
    }
    setAuthLoading(false);
  }, []);

  const login = useCallback((user, token) => {
    localStorage.setItem("medicare_user", JSON.stringify(user));
    localStorage.setItem("medicare_token", token);
    setCurrentUser(user);
  }, []);

  const logout = useCallback(async () => {
    try { await api("/api/auth/logout", { method: "POST" }); } catch {}
    localStorage.removeItem("medicare_user");
    localStorage.removeItem("medicare_token");
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, login, logout, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() { return useContext(AuthContext); }

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Antibiotics", "Analgesics", "Vitamins", "Antacids", "Antihistamines", "Diabetes", "Cardiology", "Dermatology"];

// ─── Auth Page ────────────────────────────────────────────────────────────────
function AuthPage() {
  const { login } = useAuth();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleLogin = async () => {
    setErr(""); setLoading(true);
    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      login(data.user, data.session.access_token);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  const handleRegister = async () => {
    setErr(""); setLoading(true);
    try {
      const data = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      login(data.user, data.session.access_token);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>MediCare</h1>
          <p>Online Pharmacy &amp; Delivery</p>
        </div>
        <div className="auth-tabs">
          <div className={`auth-tab${tab === "login" ? " active" : ""}`} onClick={() => { setTab("login"); setErr(""); }}>Sign In</div>
          <div className={`auth-tab${tab === "register" ? " active" : ""}`} onClick={() => { setTab("register"); setErr(""); }}>Register</div>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        {tab === "login" ? (
          <>
            <div className="form-group"><label className="form-label">Email</label><input id="login-email" className="form-control" value={form.email} onChange={set("email")} placeholder="you@example.com" /></div>
            <div className="form-group"><label className="form-label">Password</label><input id="login-password" className="form-control" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" /></div>
            <button id="btn-login" className="btn btn-primary w-full mb-3" style={{ justifyContent: "center" }} onClick={handleLogin} disabled={loading}>
              {loading ? <span className="spinner" /> : "Sign In"}
            </button>
          </>
        ) : (
          <>
            <div className="form-group"><label className="form-label">Full Name</label><input id="reg-name" className="form-control" value={form.name} onChange={set("name")} placeholder="Your name" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Email</label><input id="reg-email" className="form-control" value={form.email} onChange={set("email")} placeholder="you@example.com" /></div>
              <div className="form-group"><label className="form-label">Phone</label><input id="reg-phone" className="form-control" value={form.phone} onChange={set("phone")} placeholder="10-digit number" /></div>
            </div>
            <div className="form-group"><label className="form-label">Password</label><input id="reg-password" className="form-control" type="password" value={form.password} onChange={set("password")} placeholder="Min 6 characters" /></div>
            <button id="btn-register" className="btn btn-primary w-full" style={{ justifyContent: "center" }} onClick={handleRegister} disabled={loading}>
              {loading ? <span className="spinner" /> : "Create Account"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ view, setView, cartCount }) {
  const { currentUser, logout } = useAuth();
  const role = currentUser?.role;

  const userNav = [
    { id: "dashboard", icon: "⊞", label: "Dashboard" },
    { id: "medicines", icon: "⬚", label: "Browse Medicines" },
    { id: "cart", icon: "◫", label: `Cart${cartCount > 0 ? ` (${cartCount})` : ""}` },
    { id: "orders", icon: "◳", label: "My Orders" },
  ];
  const adminNav = [
    { id: "admin-dashboard", icon: "⊞", label: "Dashboard" },
    { id: "inventory", icon: "◰", label: "Inventory" },
    { id: "admin-orders", icon: "◳", label: "All Orders" },
    { id: "users", icon: "◫", label: "Users" },
    { id: "medicines", icon: "⬚", label: "Browse Catalog" },
  ];
  const pharmacistNav = [
    { id: "admin-dashboard", icon: "⊞", label: "Dashboard" },
    { id: "medicines", icon: "⬚", label: "Browse Medicines" },
    { id: "admin-orders", icon: "◳", label: "All Orders" },
    { id: "inventory", icon: "◰", label: "Inventory" },
  ];

  const navItems = role === "admin" ? adminNav : role === "pharmacist" ? pharmacistNav : userNav;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>MediCare</h1>
        <p>Pharmacy Management</p>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          {navItems.map((item) => (
            <div key={item.id} className={`nav-item${view === item.id ? " active" : ""}`} onClick={() => setView(item.id)}>
              <span className="icon">{item.icon}</span>{item.label}
            </div>
          ))}
        </div>
      </nav>
      <div className="sidebar-user">
        <div className="user-chip">
          <div className="avatar">{currentUser?.name?.slice(0, 2).toUpperCase()}</div>
          <div className="user-info">
            <p>{currentUser?.name}</p>
            <span className={`badge badge-${role}`}>{role}</span>
          </div>
          <button className="btn btn-ghost btn-xs" style={{ marginLeft: "auto" }} onClick={logout} title="Logout">↩</button>
        </div>
      </div>
    </aside>
  );
}

// ─── User Dashboard ───────────────────────────────────────────────────────────
function UserDashboard({ setView }) {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/orders").then((d) => { setOrders(d.orders || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const recent = orders.slice(0, 5);
  const delivered = orders.filter((o) => o.status === "Delivered").length;
  const pending = orders.filter((o) => o.status !== "Delivered").length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-semibold" style={{ fontSize: 20, marginBottom: 4 }}>Welcome back, {currentUser?.name?.split(" ")[0]} 👋</h2>
        <p className="text-muted">Here&apos;s an overview of your account.</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Orders</div><div className="stat-value">{orders.length}</div></div>
        <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value">{pending}</div></div>
        <div className="stat-card"><div className="stat-label">Delivered</div><div className="stat-value">{delivered}</div></div>
        <div className="stat-card"><div className="stat-label">Account</div><div className="stat-value" style={{ fontSize: 14, paddingTop: 6 }}>Active</div></div>
      </div>
      <div className="card mb-5">
        <div className="card-header">
          <span className="card-title">Recent Orders</span>
          <button className="btn btn-outline btn-sm" onClick={() => setView("orders")}>View All</button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div className="loading-center"><span className="spinner" /></div> :
            recent.length === 0 ? <div className="empty"><p>No orders yet. Browse medicines to get started!</p></div> :
              <div className="table-wrap"><table>
                <thead><tr><th>Order ID</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead>
                <tbody>{recent.map((o) => (
                  <tr key={o.id}>
                    <td><span className="font-medium">#{o.id}</span></td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>₹{o.total}</td>
                    <td><span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span></td>
                    <td><button className="btn btn-ghost btn-xs" onClick={() => setView(`order-detail:${o.id}`)}>Details →</button></td>
                  </tr>
                ))}</tbody>
              </table></div>}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Quick Actions</span></div>
        <div className="card-body flex gap-3">
          <button className="btn btn-primary" onClick={() => setView("medicines")}>Browse Medicines</button>
          <button className="btn btn-outline" onClick={() => setView("cart")}>View Cart</button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({ setView }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/admin/stats").then((d) => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><span className="spinner" /><span>Loading dashboard...</span></div>;
  if (!stats) return <div className="empty"><p>Failed to load dashboard stats.</p></div>;

  const { stats: s, recentOrders, lowStockAlerts } = stats;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-semibold" style={{ fontSize: 20, marginBottom: 4 }}>Admin Dashboard</h2>
        <p className="text-muted">System overview &amp; analytics</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Users</div><div className="stat-value">{s.totalUsers}</div><div className="stat-sub">Registered accounts</div></div>
        <div className="stat-card"><div className="stat-label">Total Orders</div><div className="stat-value">{s.totalOrders}</div><div className="stat-sub">All time</div></div>
        <div className="stat-card"><div className="stat-label">Medicines</div><div className="stat-value">{s.totalMedicines}</div><div className="stat-sub">In catalog</div></div>
        <div className="stat-card"><div className="stat-label">Low Stock</div><div className="stat-value" style={{ color: s.lowStockCount > 0 ? "var(--red)" : "inherit" }}>{s.lowStockCount}</div><div className="stat-sub">Need restock</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Orders</span><button className="btn btn-ghost btn-xs" onClick={() => setView("admin-orders")}>View all</button></div>
          <div style={{ padding: 0 }}>
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between" style={{ padding: "10px 20px", borderBottom: "1px solid var(--border)" }}>
                <div><p className="font-medium" style={{ fontSize: 13 }}>#{o.id}</p><p className="text-sm text-muted">{o.profiles?.name}</p></div>
                <div className="flex items-center gap-2"><span className="font-medium">₹{o.total}</span><span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span></div>
              </div>
            ))}
            {recentOrders.length === 0 && <div className="empty" style={{ padding: 24 }}><p>No orders yet.</p></div>}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Low Stock Alerts</span></div>
          {lowStockAlerts.length === 0 ? <div className="empty" style={{ padding: 24 }}><p>All medicines well-stocked!</p></div> :
            lowStockAlerts.map((m) => (
              <div key={m.id} className="flex items-center justify-between" style={{ padding: "10px 20px", borderBottom: "1px solid var(--border)" }}>
                <div><p className="font-medium" style={{ fontSize: 13 }}>{m.name}</p><p className="text-sm text-muted">{m.category}</p></div>
                <span style={{ color: m.stock === 0 ? "var(--red)" : "var(--amber)", fontSize: 13, fontWeight: 600 }}>{m.stock === 0 ? "Out of stock" : `${m.stock} left`}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ─── Medicines Page ───────────────────────────────────────────────────────────
function MedicinesPage({ setView, onCartUpdate }) {
  const { currentUser } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [added, setAdded] = useState(null);
  const [addingId, setAddingId] = useState(null);

  const fetchMedicines = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (cat !== "All") params.set("cat", cat);
    api(`/api/medicines?${params}`).then((d) => { setMedicines(d.medicines || []); setLoading(false); }).catch(() => setLoading(false));
  }, [search, cat]);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

  const addToCart = async (m) => {
    if (m.stock === 0) return;
    setAddingId(m.id);
    try {
      await api("/api/cart", { method: "POST", body: JSON.stringify({ medicine_id: m.id, quantity: 1 }) });
      setAdded(m.id);
      setTimeout(() => setAdded(null), 1500);
      if (onCartUpdate) onCartUpdate();
    } catch (e) { alert(e.message); }
    setAddingId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="font-semibold" style={{ fontSize: 18 }}>Medicine Catalog</h2><p className="text-muted text-sm mt-1">{medicines.length} medicines available</p></div>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="search-bar" style={{ flex: 1 }}>
          <span className="search-icon">⌕</span>
          <input id="medicine-search" className="form-control" placeholder="Search by medicine name or brand..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="chips">
        {CATEGORIES.map((c) => <span key={c} className={`chip${cat === c ? " active" : ""}`} onClick={() => setCat(c)}>{c}</span>)}
      </div>
      {loading ? <div className="loading-center"><span className="spinner" /></div> :
        medicines.length === 0 ? <div className="empty"><div className="icon">⊘</div><p>No medicines found.</p></div> :
          <div className="med-grid">
            {medicines.map((m) => (
              <div key={m.id} className="med-card" onClick={() => setView(`med-detail:${m.id}`)}>
                <div className="med-cat">{m.category}</div>
                <div className="med-name">{m.name}</div>
                <div className="med-brand">{m.brand}</div>
                {m.prescription_required && <span className="badge" style={{ background: "var(--amber-light)", color: "var(--amber)", fontSize: 10, marginBottom: 8, display: "inline-block" }}>Rx Required</span>}
                <div className="med-footer">
                  <div>
                    <div className="med-price">₹{m.price}</div>
                    <div className={`med-stock${m.stock <= 15 ? " stock-low" : ""}`}>{m.stock === 0 ? "Out of stock" : m.stock <= 15 ? `Only ${m.stock} left` : "In stock"}</div>
                  </div>
                  {currentUser?.role === "user" && (
                    <button className={`btn btn-sm ${added === m.id ? "btn-outline" : "btn-primary"}`} style={{ fontSize: 12 }}
                      disabled={m.stock === 0 || addingId === m.id}
                      onClick={(e) => { e.stopPropagation(); addToCart(m); }}>
                      {added === m.id ? "Added ✓" : m.stock === 0 ? "Unavailable" : addingId === m.id ? "..." : "+ Cart"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>}
    </div>
  );
}

// ─── Medicine Detail ──────────────────────────────────────────────────────────
function MedDetailPage({ medId, setView, onCartUpdate }) {
  const { currentUser } = useAuth();
  const [med, setMed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api(`/api/medicines/${medId}`).then((d) => { setMed(d.medicine); setLoading(false); }).catch(() => setLoading(false));
  }, [medId]);

  const addToCart = async () => {
    setAdding(true);
    try {
      await api("/api/cart", { method: "POST", body: JSON.stringify({ medicine_id: med.id, quantity: 1 }) });
      setAdded(true); setTimeout(() => setAdded(false), 1500);
      if (onCartUpdate) onCartUpdate();
    } catch (e) { alert(e.message); }
    setAdding(false);
  };

  if (loading) return <div className="loading-center"><span className="spinner" /></div>;
  if (!med) return <div className="empty"><p>Medicine not found.</p></div>;

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => setView("medicines")}>← Back to Catalog</button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-2">
              <span className="chip active" style={{ cursor: "default" }}>{med.category}</span>
              {med.prescription_required && <span className="badge" style={{ background: "var(--amber-light)", color: "var(--amber)" }}>Rx Required</span>}
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, marginBottom: 4 }}>{med.name}</h1>
            <p className="text-muted mb-4">{med.brand} • {med.dosage}</p>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <h3 className="font-semibold mb-2" style={{ fontSize: 14 }}>Description</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text2)" }}>{med.description}</p>
            </div>
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div className="stat-card"><div className="stat-label">Dosage</div><div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{med.dosage}</div></div>
              <div className="stat-card"><div className="stat-label">Category</div><div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{med.category}</div></div>
              <div className="stat-card"><div className="stat-label">Prescription</div><div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{med.prescription_required ? "Required" : "Not Required"}</div></div>
            </div>
          </div>
        </div>
        <div>
          <div className="card mb-4">
            <div className="card-body">
              <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 4 }}>₹{med.price}</div>
              <p className={`hint mb-4 ${med.stock <= 15 ? "stock-low" : ""}`}>{med.stock === 0 ? "Out of stock" : med.stock <= 15 ? `Only ${med.stock} units left` : `${med.stock} units in stock`}</p>
              {currentUser?.role === "user" && (
                <button className={`btn w-full ${added ? "btn-outline" : "btn-primary"}`} style={{ justifyContent: "center" }}
                  disabled={med.stock === 0 || adding} onClick={addToCart}>
                  {added ? "Added to Cart ✓" : med.stock === 0 ? "Out of Stock" : adding ? "Adding..." : "Add to Cart"}
                </button>
              )}
              <button className="btn btn-outline w-full mt-2" style={{ justifyContent: "center" }}
                onClick={() => setView(currentUser?.role === "user" ? "cart" : "inventory")}>
                {currentUser?.role === "user" ? "View Cart" : "Manage Inventory"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Page ────────────────────────────────────────────────────────────────
function CartPage({ setView, onCartUpdate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  const fetchCart = useCallback(() => {
    api("/api/cart").then((d) => { setItems(d.items || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const updateQty = async (medId, qty) => {
    try {
      await api("/api/cart", { method: "PUT", body: JSON.stringify({ medicine_id: medId, quantity: qty }) });
      fetchCart(); if (onCartUpdate) onCartUpdate();
    } catch (e) { alert(e.message); }
  };

  const removeItem = async (medId) => {
    try {
      await api("/api/cart", { method: "DELETE", body: JSON.stringify({ medicine_id: medId }) });
      fetchCart(); if (onCartUpdate) onCartUpdate();
    } catch (e) { alert(e.message); }
  };

  const placeOrder = async () => {
    if (!address.trim()) return;
    setPlacing(true);
    try {
      await api("/api/orders", { method: "POST", body: JSON.stringify({ address }) });
      setPlaced(true);
      if (onCartUpdate) onCartUpdate();
      setTimeout(() => { setPlaced(false); setView("orders"); }, 2000);
    } catch (e) { alert(e.message); }
    setPlacing(false);
  };

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  if (placed) return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
      <h2 className="font-semibold" style={{ fontSize: 22, color: "var(--accent)" }}>Order Placed Successfully!</h2>
      <p className="text-muted mt-2">Redirecting to your orders...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <h2 className="font-semibold mb-5" style={{ fontSize: 18 }}>Shopping Cart</h2>
      {loading ? <div className="loading-center"><span className="spinner" /></div> :
        items.length === 0 ? (
          <div className="empty"><div className="icon">◫</div><p>Your cart is empty.</p><button className="btn btn-primary mt-4" onClick={() => setView("medicines")}>Browse Medicines</button></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">{totalQty} item{totalQty !== 1 ? "s" : ""}</span></div>
              <div className="card-body" style={{ paddingTop: 0 }}>
                {items.map((item) => (
                  <div key={item.medId} className="cart-item">
                    <div style={{ flex: 1 }}>
                      <p className="font-medium" style={{ fontSize: 13 }}>{item.name}</p>
                      <p className="text-sm text-muted">₹{item.price} each</p>
                    </div>
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => updateQty(item.medId, item.qty - 1)}>−</button>
                      <span style={{ minWidth: 20, textAlign: "center", fontSize: 14, fontWeight: 500 }}>{item.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.medId, item.qty + 1)}>+</button>
                    </div>
                    <div style={{ width: 60, textAlign: "right", fontWeight: 600 }}>₹{item.price * item.qty}</div>
                    <button className="btn btn-ghost btn-xs" style={{ color: "var(--red)" }} onClick={() => removeItem(item.medId)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="card mb-4">
                <div className="card-header"><span className="card-title">Order Summary</span></div>
                <div className="card-body">
                  {items.map((i) => (
                    <div key={i.medId} className="flex justify-between mb-2" style={{ fontSize: 13 }}>
                      <span className="text-muted">{i.name} × {i.qty}</span><span>₹{i.price * i.qty}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 8 }}>
                    <div className="flex justify-between font-semibold"><span>Total</span><span>₹{total}</span></div>
                  </div>
                  <div className="form-group mt-4">
                    <label className="form-label">Delivery Address</label>
                    <textarea id="delivery-address" className="form-control" rows={3} placeholder="Enter your full delivery address..." value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <button id="btn-place-order" className="btn btn-primary w-full mt-1" style={{ justifyContent: "center" }} disabled={!address.trim() || placing} onClick={placeOrder}>
                    {placing ? "Placing Order..." : "Place Order"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

// ─── Order Progress ───────────────────────────────────────────────────────────
function OrderProgress({ status }) {
  const steps = ["Placed", "Processing", "Delivered"];
  const idx = steps.indexOf(status);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, border: `2px solid ${i <= idx ? "var(--accent)" : "var(--border2)"}`, background: i < idx ? "var(--accent)" : "var(--surface)", color: i < idx ? "white" : i === idx ? "var(--accent)" : "var(--text3)" }}>{i < idx ? "✓" : i + 1}</div>
            <span style={{ fontSize: 10, color: i <= idx ? "var(--accent-text)" : "var(--text3)", marginTop: 3, fontWeight: i === idx ? 500 : 400 }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div style={{ width: 48, height: 2, background: i < idx ? "var(--accent)" : "var(--border)", margin: "0 4px", marginBottom: 14 }} />}
        </div>
      ))}
    </div>
  );
}

// ─── Orders Page (User) ───────────────────────────────────────────────────────
function OrdersPage({ setView }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/orders").then((d) => { setOrders(d.orders || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="font-semibold mb-5" style={{ fontSize: 18 }}>Order History</h2>
      {loading ? <div className="loading-center"><span className="spinner" /></div> :
        orders.length === 0 ? <div className="empty"><div className="icon">◳</div><p>No orders yet.</p></div> :
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {orders.map((o) => (
              <div key={o.id} className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-3">
                    <div><span className="font-semibold">#{o.id}</span><span className="text-muted text-sm" style={{ marginLeft: 10 }}>{new Date(o.created_at).toLocaleDateString()}</span></div>
                    <span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    {(o.order_items || []).map((i) => (
                      <span key={i.id} style={{ display: "inline-block", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "2px 8px", fontSize: 12, marginRight: 6, marginBottom: 4 }}>{i.medicine_name} × {i.quantity}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <OrderProgress status={o.status} />
                    <div className="text-right">
                      <div className="font-semibold" style={{ fontSize: 16 }}>₹{o.total}</div>
                      <button className="btn btn-ghost btn-xs mt-1" onClick={() => setView(`order-detail:${o.id}`)}>View Details →</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>}
    </div>
  );
}

// ─── Order Detail ─────────────────────────────────────────────────────────────
function OrderDetailPage({ orderId, setView }) {
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/api/orders/${orderId}`).then((d) => { setOrder(d.order); setLoading(false); }).catch(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div className="loading-center"><span className="spinner" /></div>;
  if (!order) return <div className="empty"><p>Order not found.</p></div>;

  const backView = currentUser?.role === "user" ? "orders" : "admin-orders";

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => setView(backView)}>← Back to Orders</button>
      <div className="card mb-4">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="font-semibold" style={{ fontSize: 18 }}>#{order.id}</h2><p className="text-muted text-sm">{new Date(order.created_at).toLocaleDateString()}</p></div>
            <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span>
          </div>
          <div className="mb-5"><OrderProgress status={order.status} /></div>
          <div className="flex gap-3">
            <div className="stat-card" style={{ flex: 1 }}><div className="stat-label">Est. Delivery</div><div className="stat-value" style={{ fontSize: 16 }}>{order.eta || "—"}</div></div>
            <div className="stat-card" style={{ flex: 1 }}><div className="stat-label">Customer</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{order.profiles?.name || "—"}</div></div>
            <div className="stat-card" style={{ flex: 1 }}><div className="stat-label">Delivery To</div><div style={{ fontSize: 12, marginTop: 4, color: "var(--text2)" }}>{order.address}</div></div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Order Items</span></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Medicine</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
          <tbody>
            {(order.order_items || []).map((i) => (
              <tr key={i.id}><td>{i.medicine_name}</td><td>{i.quantity}</td><td>₹{i.price}</td><td className="font-medium">₹{i.price * i.quantity}</td></tr>
            ))}
          </tbody>
        </table></div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
          <span className="font-semibold" style={{ fontSize: 15 }}>Total: ₹{order.total}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Inventory (Admin) ────────────────────────────────────────────────────────
function MedicineModal({ med, onClose, onSave }) {
  const [form, setForm] = useState(med ? {
    name: med.name, brand: med.brand, category: med.category,
    price: med.price, stock: med.stock, description: med.description,
    dosage: med.dosage, prescription_required: med.prescription_required,
  } : { name: "", brand: "", category: "Antibiotics", price: "", stock: "", description: "", dosage: "", prescription_required: false });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{med ? "Edit Medicine" : "Add New Medicine"}</span>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label className="form-label">Medicine Name</label><input className="form-control" value={form.name} onChange={set("name")} /></div>
            <div className="form-group"><label className="form-label">Brand Name</label><input className="form-control" value={form.brand} onChange={set("brand")} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Category</label>
              <select className="form-control" value={form.category} onChange={set("category")}>
                {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Dosage</label><input className="form-control" value={form.dosage} onChange={set("dosage")} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Price (₹)</label><input className="form-control" type="number" value={form.price} onChange={set("price")} /></div>
            <div className="form-group"><label className="form-label">Stock Quantity</label><input className="form-control" type="number" min={0} value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Math.max(0, parseInt(e.target.value) || 0) }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={form.description} onChange={set("description")} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="rx-check" checked={form.prescription_required} onChange={(e) => setForm((f) => ({ ...f, prescription_required: e.target.checked }))} />
            <label htmlFor="rx-check" className="form-label" style={{ margin: 0 }}>Prescription Required</label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Medicine"}</button>
        </div>
      </div>
    </div>
  );
}

function InventoryPage({ setView }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api("/api/medicines?limit=100").then((d) => { setMedicines(d.medicines || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const reload = () => api("/api/medicines?limit=100").then((d) => setMedicines(d.medicines || [])).catch(() => {});

  const save = async (form) => {
    try {
      if (modal === "new") {
        await api("/api/medicines", { method: "POST", body: JSON.stringify(form) });
      } else {
        await api(`/api/medicines/${modal.id}`, { method: "PUT", body: JSON.stringify(form) });
      }
      setModal(null); reload();
    } catch (e) { alert(e.message); }
  };

  const deleteMed = async (m) => {
    if (!confirm(`Delete ${m.name}?`)) return;
    try { await api(`/api/medicines/${m.id}`, { method: "DELETE" }); reload(); } catch (e) { alert(e.message); }
  };

  const updateStock = async (m) => {
    const val = prompt(`Update stock for ${m.name} (current: ${m.stock}):`, m.stock);
    if (val === null) return;
    const stock = parseInt(val);
    if (isNaN(stock) || stock < 0) { alert("Invalid stock value"); return; }
    try { await api(`/api/inventory/${m.id}/stock`, { method: "PATCH", body: JSON.stringify({ stock }) }); reload(); } catch (e) { alert(e.message); }
  };

  const filtered = medicines.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="font-semibold" style={{ fontSize: 18 }}>Inventory Management</h2><p className="text-muted text-sm">{medicines.length} medicines in catalog</p></div>
        <button className="btn btn-primary" onClick={() => setModal("new")}>+ Add Medicine</button>
      </div>
      <div className="search-bar mb-4"><span className="search-icon">⌕</span><input className="form-control" placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <div className="card">
        {loading ? <div className="loading-center"><span className="spinner" /></div> :
          <div className="table-wrap"><table>
            <thead><tr><th>Name</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th>Rx</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium">{m.name}</td>
                  <td className="text-muted">{m.brand}</td>
                  <td><span className="chip" style={{ fontSize: 11, padding: "2px 8px", cursor: "default" }}>{m.category}</span></td>
                  <td>₹{m.price}</td>
                  <td><span style={{ color: m.stock === 0 ? "var(--red)" : m.stock <= 15 ? "var(--amber)" : "inherit", fontWeight: m.stock <= 15 ? 600 : 400 }}>{m.stock}</span></td>
                  <td>{m.prescription_required ? <span style={{ color: "var(--amber)", fontSize: 12, fontWeight: 600 }}>Rx</span> : <span className="text-muted">—</span>}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-outline btn-xs" onClick={() => setModal(m)}>Edit</button>
                      <button className="btn btn-outline btn-xs" onClick={() => updateStock(m)}>Stock</button>
                      <button className="btn btn-danger btn-xs" onClick={() => deleteMed(m)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>}
      </div>
      {modal && <MedicineModal med={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}

// ─── Admin Orders Page ────────────────────────────────────────────────────────
function AdminOrdersPage({ setView }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const statuses = ["All", "Placed", "Processing", "Delivered", "Cancelled"];

  const fetchOrders = useCallback(() => {
    const params = filter !== "All" ? `?status=${filter}` : "";
    api(`/api/admin/orders${params}`).then((d) => { setOrders(d.orders || []); setLoading(false); }).catch(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId, status) => {
    try {
      await api("/api/admin/orders", { method: "PATCH", body: JSON.stringify({ order_id: orderId, status }) });
      fetchOrders();
    } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="font-semibold" style={{ fontSize: 18 }}>All Orders</h2><p className="text-muted text-sm">{orders.length} orders</p></div>
      </div>
      <div className="chips mb-4">
        {statuses.map((s) => <span key={s} className={`chip${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}>{s}</span>)}
      </div>
      <div className="card">
        {loading ? <div className="loading-center"><span className="spinner" /></div> :
          <div className="table-wrap"><table>
            <thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="font-medium">#{o.id}</td>
                  <td>{o.profiles?.name || "Unknown"}</td>
                  <td className="text-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="text-muted text-sm">{(o.order_items || []).length} item(s)</td>
                  <td className="font-medium">₹{o.total}</td>
                  <td><span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-xs" onClick={() => setView(`order-detail:${o.id}`)}>View</button>
                      <select className="form-control" style={{ padding: "3px 6px", fontSize: 11, height: "auto", width: "auto" }}
                        value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}>
                        {["Placed", "Processing", "Delivered", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>}
      </div>
    </div>
  );
}

// ─── Users Page (Admin) ───────────────────────────────────────────────────────
function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/admin/users").then((d) => { setUsers(d.users || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-5"><h2 className="font-semibold" style={{ fontSize: 18 }}>Registered Users</h2><p className="text-muted text-sm">{users.length} users in the system</p></div>
      <div className="card">
        {loading ? <div className="loading-center"><span className="spinner" /></div> :
          <div className="table-wrap"><table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Orders</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{u.name?.slice(0, 2).toUpperCase()}</div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-muted">{u.email}</td>
                  <td className="text-muted">{u.phone}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td>{u.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table></div>}
      </div>
    </div>
  );
}

// ─── Topbar Info ──────────────────────────────────────────────────────────────
const topbarMap = {
  dashboard: { title: "Dashboard", sub: "Your account overview" },
  "admin-dashboard": { title: "Admin Dashboard", sub: "System overview" },
  medicines: { title: "Browse Medicines", sub: "Search and explore our catalog" },
  cart: { title: "Shopping Cart", sub: "Review and place your order" },
  orders: { title: "My Orders", sub: "Track and view your orders" },
  inventory: { title: "Inventory Management", sub: "Manage medicine stock" },
  "admin-orders": { title: "All Orders", sub: "Manage and update orders" },
  users: { title: "Users", sub: "Registered accounts" },
};

function getTopbarInfo(view) {
  const base = view.split(":")[0];
  if (base === "med-detail") return { title: "Medicine Details", sub: "Detailed product information" };
  if (base === "order-detail") return { title: "Order Details", sub: "Detailed order information" };
  return topbarMap[base] || { title: "MediCare", sub: "" };
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function AppShell() {
  const { currentUser, authLoading } = useAuth();
  const [view, setView] = useState(() => {
    if (typeof window === "undefined") return "dashboard";
    return "dashboard";
  });
  const [cartCount, setCartCount] = useState(0);

  // Set default view based on role
  useEffect(() => {
    if (currentUser) {
      setView(currentUser.role === "admin" || currentUser.role === "pharmacist" ? "admin-dashboard" : "dashboard");
      if (currentUser.role === "user") {
        api("/api/cart").then((d) => setCartCount(d.itemCount || 0)).catch(() => {});
      }
    }
  }, [currentUser]);

  const refreshCartCount = useCallback(() => {
    if (currentUser?.role === "user") {
      api("/api/cart").then((d) => setCartCount(d.itemCount || 0)).catch(() => {});
    }
  }, [currentUser]);

  if (authLoading) return <div className="loading-center" style={{ minHeight: "100vh" }}><span className="spinner" /></div>;
  if (!currentUser) return <AuthPage />;

  const { title, sub } = getTopbarInfo(view);
  const viewBase = view.split(":")[0];
  const viewParam = view.split(":")[1];

  const renderPage = () => {
    switch (viewBase) {
      case "dashboard": return <UserDashboard setView={setView} />;
      case "admin-dashboard": return <AdminDashboard setView={setView} />;
      case "medicines": return <MedicinesPage setView={setView} onCartUpdate={refreshCartCount} />;
      case "med-detail": return <MedDetailPage medId={viewParam} setView={setView} onCartUpdate={refreshCartCount} />;
      case "cart": return <CartPage setView={setView} onCartUpdate={refreshCartCount} />;
      case "orders": return <OrdersPage setView={setView} />;
      case "order-detail": return <OrderDetailPage orderId={viewParam} setView={setView} />;
      case "inventory": return <InventoryPage setView={setView} />;
      case "admin-orders": return <AdminOrdersPage setView={setView} />;
      case "users": return <UsersPage />;
      default: return <UserDashboard setView={setView} />;
    }
  };

  return (
    <div className="app">
      <Sidebar view={viewBase} setView={setView} cartCount={cartCount} />
      <div className="main">
        <div className="topbar">
          <div><h2>{title}</h2><p>{sub}</p></div>
        </div>
        <div className="content">{renderPage()}</div>
      </div>
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
