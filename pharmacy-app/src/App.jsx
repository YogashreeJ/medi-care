import { useState, useEffect, createContext, useContext, useReducer } from "react";

// ─── Design tokens ───────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f5f4f0;
    --surface: #ffffff;
    --surface2: #f9f8f5;
    --border: #e8e6df;
    --border2: #d4d1c7;
    --text: #1a1917;
    --text2: #6b6860;
    --text3: #9b9890;
    --accent: #2d5a3d;
    --accent-light: #e8f2ec;
    --accent-text: #1e3d29;
    --red: #c0392b;
    --red-light: #fdf2f1;
    --amber: #b8860b;
    --amber-light: #fdf8e8;
    --blue: #1a5276;
    --blue-light: #eaf2f8;
    --radius: 10px;
    --radius-lg: 14px;
    --shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  }

  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); font-size: 14px; line-height: 1.6; }

  .app { display: flex; min-height: 100vh; }

  /* Sidebar */
  .sidebar { width: 240px; min-height: 100vh; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0; }
  .sidebar-logo { padding: 24px 20px 20px; border-bottom: 1px solid var(--border); }
  .sidebar-logo h1 { font-family: 'Playfair Display', serif; font-size: 18px; color: var(--accent); letter-spacing: -0.3px; }
  .sidebar-logo p { font-size: 11px; color: var(--text3); margin-top: 2px; }
  .sidebar-nav { flex: 1; padding: 12px 8px; }
  .nav-section { margin-bottom: 20px; }
  .nav-label { font-size: 10px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.8px; padding: 0 12px; margin-bottom: 4px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; cursor: pointer; color: var(--text2); font-size: 13.5px; transition: all 0.15s; }
  .nav-item:hover { background: var(--surface2); color: var(--text); }
  .nav-item.active { background: var(--accent-light); color: var(--accent-text); font-weight: 500; }
  .nav-item .icon { width: 16px; text-align: center; font-size: 15px; }
  .sidebar-user { padding: 16px; border-top: 1px solid var(--border); }
  .user-chip { display: flex; align-items: center; gap: 10px; }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--accent-light); color: var(--accent-text); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; }
  .user-info p { font-size: 13px; font-weight: 500; }
  .user-info span { font-size: 11px; color: var(--text3); text-transform: capitalize; }
  .badge { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 20px; }
  .badge-admin { background: #2d5a3d22; color: var(--accent-text); }
  .badge-pharmacist { background: var(--blue-light); color: var(--blue); }
  .badge-user { background: var(--surface2); color: var(--text2); border: 1px solid var(--border); }

  /* Main */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .topbar { padding: 16px 28px; background: var(--surface); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .topbar h2 { font-size: 17px; font-weight: 600; }
  .topbar p { font-size: 13px; color: var(--text2); }
  .content { flex: 1; padding: 28px; overflow-y: auto; }

  /* Cards */
  .card { background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow); }
  .card-header { padding: 18px 20px 14px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .card-title { font-size: 14px; font-weight: 600; }
  .card-body { padding: 20px; }

  /* Stats */
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); padding: 18px 20px; }
  .stat-label { font-size: 12px; color: var(--text3); font-weight: 500; margin-bottom: 6px; }
  .stat-value { font-size: 26px; font-weight: 600; color: var(--text); font-variant-numeric: tabular-nums; }
  .stat-sub { font-size: 12px; color: var(--text3); margin-top: 3px; }

  /* Buttons */
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; font-family: inherit; }
  .btn-primary { background: var(--accent); color: white; border-color: var(--accent); }
  .btn-primary:hover { background: var(--accent-text); border-color: var(--accent-text); }
  .btn-outline { background: transparent; color: var(--text2); border-color: var(--border2); }
  .btn-outline:hover { background: var(--surface2); color: var(--text); }
  .btn-ghost { background: transparent; color: var(--text2); border-color: transparent; }
  .btn-ghost:hover { background: var(--surface2); }
  .btn-danger { background: var(--red-light); color: var(--red); border-color: #f5c6c2; }
  .btn-danger:hover { background: #fae5e3; }
  .btn-sm { padding: 5px 11px; font-size: 12px; }
  .btn-xs { padding: 3px 8px; font-size: 11px; }
  .btn-icon { padding: 7px; border-radius: 7px; }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* Form */
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 12.5px; font-weight: 500; color: var(--text2); margin-bottom: 5px; }
  .form-control { width: 100%; padding: 9px 13px; border: 1px solid var(--border2); border-radius: 8px; font-size: 13.5px; font-family: inherit; background: var(--surface); color: var(--text); outline: none; transition: border-color 0.15s; }
  .form-control:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(45,90,61,0.1); }
  select.form-control { cursor: pointer; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .input-group { display: flex; gap: 0; }
  .input-group .form-control { border-radius: 8px 0 0 8px; }
  .input-group .btn { border-radius: 0 8px 8px 0; border-left: none; }

  /* Table */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { border-bottom: 1px solid var(--border); }
  th { text-align: left; font-size: 11.5px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; }
  td { padding: 12px 14px; border-bottom: 1px solid var(--border); font-size: 13.5px; color: var(--text); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--surface2); }

  /* Status badges */
  .status { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 500; }
  .status::before { content: ''; width: 5px; height: 5px; border-radius: 50%; }
  .status-placed { background: var(--blue-light); color: var(--blue); }
  .status-placed::before { background: var(--blue); }
  .status-processing { background: var(--amber-light); color: var(--amber); }
  .status-processing::before { background: var(--amber); }
  .status-delivered { background: var(--accent-light); color: var(--accent-text); }
  .status-delivered::before { background: var(--accent); }
  .status-cancelled { background: var(--red-light); color: var(--red); }
  .status-cancelled::before { background: var(--red); }

  /* Medicine card */
  .med-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
  .med-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; cursor: pointer; transition: all 0.15s; position: relative; overflow: hidden; }
  .med-card:hover { box-shadow: var(--shadow-md); border-color: var(--border2); transform: translateY(-1px); }
  .med-cat { font-size: 10.5px; font-weight: 600; color: var(--accent); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .med-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
  .med-brand { font-size: 12px; color: var(--text3); margin-bottom: 10px; }
  .med-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
  .med-price { font-size: 16px; font-weight: 700; color: var(--text); }
  .med-stock { font-size: 11px; color: var(--text3); }
  .stock-low { color: var(--red); }

  /* Cart */
  .cart-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
  .cart-item:last-child { border-bottom: none; }
  .qty-ctrl { display: flex; align-items: center; gap: 8px; }
  .qty-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--border2); background: var(--surface2); color: var(--text); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px; line-height: 1; }
  .qty-btn:hover { background: var(--bg); }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
  .modal { background: var(--surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
  .modal-header { padding: 20px 24px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .modal-title { font-size: 16px; font-weight: 600; }
  .modal-body { padding: 20px 24px; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; gap: 10px; justify-content: flex-end; }

  /* Auth */
  .auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: 20px; }
  .auth-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 40px; width: 100%; max-width: 420px; box-shadow: var(--shadow-md); }
  .auth-logo { text-align: center; margin-bottom: 28px; }
  .auth-logo h1 { font-family: 'Playfair Display', serif; font-size: 24px; color: var(--accent); }
  .auth-logo p { font-size: 13px; color: var(--text2); margin-top: 4px; }
  .auth-tabs { display: flex; gap: 2px; background: var(--surface2); border-radius: 9px; padding: 3px; margin-bottom: 24px; }
  .auth-tab { flex: 1; text-align: center; padding: 7px; border-radius: 7px; cursor: pointer; font-size: 13px; color: var(--text2); font-weight: 500; }
  .auth-tab.active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }

  /* Search bar */
  .search-bar { position: relative; }
  .search-bar input { padding-left: 36px; }
  .search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text3); font-size: 14px; pointer-events: none; }

  /* Filter chips */
  .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .chip { padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); color: var(--text2); background: var(--surface); }
  .chip.active { background: var(--accent-light); color: var(--accent-text); border-color: #b5d6bf; }

  /* Alert */
  .alert { padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
  .alert-error { background: var(--red-light); color: var(--red); border: 1px solid #f5c6c2; }
  .alert-success { background: var(--accent-light); color: var(--accent-text); border: 1px solid #b5d6bf; }

  /* Progress */
  .order-progress { display: flex; align-items: center; gap: 0; margin: 16px 0; }
  .progress-step { display: flex; flex-direction: column; align-items: center; flex: 1; }
  .progress-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; border: 2px solid var(--border2); background: var(--surface); color: var(--text3); z-index: 1; }
  .progress-dot.done { background: var(--accent); border-color: var(--accent); color: white; }
  .progress-dot.active { border-color: var(--accent); color: var(--accent); }
  .progress-line { height: 2px; flex: 1; background: var(--border); margin: 0 -2px; position: relative; top: -14px; z-index: 0; }
  .progress-line.done { background: var(--accent); }
  .progress-label { font-size: 10.5px; color: var(--text3); margin-top: 4px; }
  .progress-label.active { color: var(--accent-text); font-weight: 500; }

  /* Empty state */
  .empty { text-align: center; padding: 48px 20px; color: var(--text3); }
  .empty .icon { font-size: 40px; margin-bottom: 12px; }
  .empty p { font-size: 14px; }

  /* Tooltip-like subtext */
  .hint { font-size: 11.5px; color: var(--text3); margin-top: 3px; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }

  /* Detail page */
  .detail-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }

  .flex { display: flex; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-2 { gap: 8px; }
  .gap-3 { gap: 12px; }
  .gap-4 { gap: 16px; }
  .mb-1 { margin-bottom: 4px; }
  .mb-2 { margin-bottom: 8px; }
  .mb-3 { margin-bottom: 12px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-5 { margin-bottom: 20px; }
  .mb-6 { margin-bottom: 24px; }
  .mt-1 { margin-top: 4px; }
  .mt-2 { margin-top: 8px; }
  .mt-4 { margin-top: 16px; }
  .text-muted { color: var(--text2); }
  .text-sm { font-size: 12px; }
  .font-medium { font-weight: 500; }
  .font-semibold { font-weight: 600; }
  .w-full { width: 100%; }
`;

// ─── Seed data ─────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Antibiotics", "Analgesics", "Vitamins", "Antacids", "Antihistamines", "Diabetes", "Cardiology", "Dermatology"];

const MEDICINES_SEED = [
  { id: 1, name: "Amoxicillin 500mg", brand: "Amoxil", category: "Antibiotics", price: 85, stock: 120, description: "Broad-spectrum penicillin antibiotic used to treat bacterial infections including ear infections, strep throat, pneumonia, and UTIs.", dosage: "500mg capsule", prescriptionRequired: true },
  { id: 2, name: "Paracetamol 650mg", brand: "Calpol", category: "Analgesics", price: 22, stock: 300, description: "Common pain reliever and fever reducer. Used for mild to moderate pain, headache, toothache, and cold/flu symptoms.", dosage: "650mg tablet", prescriptionRequired: false },
  { id: 3, name: "Vitamin D3 1000 IU", brand: "Sunvit", category: "Vitamins", price: 150, stock: 85, description: "Dietary supplement for bone health, immune function, and calcium absorption. Recommended for deficiency prevention.", dosage: "1000 IU softgel", prescriptionRequired: false },
  { id: 4, name: "Pantoprazole 40mg", brand: "Pantocid", category: "Antacids", price: 65, stock: 200, description: "Proton pump inhibitor that reduces stomach acid production. Used for GERD, peptic ulcers, and Zollinger-Ellison syndrome.", dosage: "40mg tablet", prescriptionRequired: true },
  { id: 5, name: "Cetirizine 10mg", brand: "Zyrtec", category: "Antihistamines", price: 45, stock: 15, description: "Second-generation antihistamine for allergic rhinitis, urticaria, and seasonal allergies with minimal drowsiness.", dosage: "10mg tablet", prescriptionRequired: false },
  { id: 6, name: "Metformin 500mg", brand: "Glucophage", category: "Diabetes", price: 38, stock: 180, description: "First-line medication for type 2 diabetes mellitus. Reduces hepatic glucose production and improves insulin sensitivity.", dosage: "500mg tablet", prescriptionRequired: true },
  { id: 7, name: "Atorvastatin 10mg", brand: "Lipitor", category: "Cardiology", price: 120, stock: 95, description: "Statin medication for hypercholesterolemia and cardiovascular disease prevention by lowering LDL cholesterol.", dosage: "10mg tablet", prescriptionRequired: true },
  { id: 8, name: "Azithromycin 250mg", brand: "Zithromax", category: "Antibiotics", price: 92, stock: 0, description: "Macrolide antibiotic effective against respiratory tract infections, skin infections, and sexually transmitted infections.", dosage: "250mg tablet", prescriptionRequired: true },
  { id: 9, name: "Ibuprofen 400mg", brand: "Brufen", category: "Analgesics", price: 30, stock: 250, description: "NSAID for pain, fever, and inflammation. Effective for headaches, muscle pain, arthritis, and menstrual cramps.", dosage: "400mg tablet", prescriptionRequired: false },
  { id: 10, name: "Clotrimazole 1%", brand: "Canesten", category: "Dermatology", price: 110, stock: 60, description: "Antifungal cream for athlete's foot, ringworm, jock itch, and candidal skin infections.", dosage: "1% topical cream", prescriptionRequired: false },
  { id: 11, name: "Vitamin B12 1500mcg", brand: "Cobadex", category: "Vitamins", price: 95, stock: 140, description: "Essential vitamin for nerve function, red blood cell formation, and DNA synthesis. Used for B12 deficiency treatment.", dosage: "1500mcg tablet", prescriptionRequired: false },
  { id: 12, name: "Amlodipine 5mg", brand: "Norvasc", category: "Cardiology", price: 55, stock: 8, description: "Calcium channel blocker for hypertension and angina. Relaxes blood vessels to improve blood flow.", dosage: "5mg tablet", prescriptionRequired: true },
];

const USERS_SEED = [
  { id: 1, name: "Admin User", email: "admin@pharma.com", phone: "9876543210", role: "admin", password: "admin123" },
  { id: 2, name: "Dr. Ravi Kumar", email: "pharmacist@pharma.com", phone: "9876543211", role: "pharmacist", password: "pharma123" },
  { id: 3, name: "Priya Sharma", email: "user@pharma.com", phone: "9876543212", role: "user", password: "user123" },
];

const ORDERS_SEED = [
  { id: "ORD-001", userId: 3, items: [{ medId: 2, name: "Paracetamol 650mg", price: 22, qty: 2 }, { medId: 9, name: "Ibuprofen 400mg", price: 30, qty: 1 }], total: 74, status: "Delivered", date: "2025-03-10", address: "42 MG Road, Chennai" },
  { id: "ORD-002", userId: 3, items: [{ medId: 3, name: "Vitamin D3 1000 IU", price: 150, qty: 1 }], total: 150, status: "Processing", date: "2025-03-22", address: "42 MG Road, Chennai" },
  { id: "ORD-003", userId: 3, items: [{ medId: 6, name: "Metformin 500mg", price: 38, qty: 3 }], total: 114, status: "Placed", date: "2025-03-28", address: "42 MG Road, Chennai" },
];

// ─── Context ──────────────────────────────────────────────────────────────
const AppContext = createContext();

function appReducer(state, action) {
  switch (action.type) {
    case "LOGIN": return { ...state, currentUser: action.user };
    case "LOGOUT": return { ...state, currentUser: null, cart: [] };
    case "REGISTER": {
      const newUser = { ...action.user, id: Date.now(), role: "user" };
      return { ...state, users: [...state.users, newUser], currentUser: newUser };
    }
    case "ADD_TO_CART": {
      const ex = state.cart.find(i => i.medId === action.item.medId);
      if (ex) return { ...state, cart: state.cart.map(i => i.medId === action.item.medId ? { ...i, qty: i.qty + 1 } : i) };
      return { ...state, cart: [...state.cart, { ...action.item, qty: 1 }] };
    }
    case "UPDATE_CART_QTY": return { ...state, cart: state.cart.map(i => i.medId === action.medId ? { ...i, qty: action.qty } : i).filter(i => i.qty > 0) };
    case "REMOVE_FROM_CART": return { ...state, cart: state.cart.filter(i => i.medId !== action.medId) };
    case "CLEAR_CART": return { ...state, cart: [] };
    case "PLACE_ORDER": {
      const order = { id: `ORD-${String(state.orders.length + 1).padStart(3, "0")}`, userId: state.currentUser.id, items: state.cart, total: state.cart.reduce((s, i) => s + i.price * i.qty, 0), status: "Placed", date: new Date().toISOString().slice(0, 10), address: action.address };
      const updatedMeds = state.medicines.map(m => { const ci = state.cart.find(i => i.medId === m.id); return ci ? { ...m, stock: Math.max(0, m.stock - ci.qty) } : m; });
      return { ...state, orders: [order, ...state.orders], cart: [], medicines: updatedMeds };
    }
    case "ADD_MEDICINE": return { ...state, medicines: [...state.medicines, { ...action.med, id: Date.now() }] };
    case "UPDATE_MEDICINE": return { ...state, medicines: state.medicines.map(m => m.id === action.med.id ? action.med : m) };
    case "DELETE_MEDICINE": return { ...state, medicines: state.medicines.filter(m => m.id !== action.id) };
    case "UPDATE_ORDER_STATUS": return { ...state, orders: state.orders.map(o => o.id === action.id ? { ...o, status: action.status } : o) };
    case "SET_VIEW": return { ...state, view: action.view, viewData: action.data || null };
    default: return state;
  }
}

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, {
    currentUser: null,
    users: USERS_SEED,
    medicines: MEDICINES_SEED,
    orders: ORDERS_SEED,
    cart: [],
    view: "dashboard",
    viewData: null,
  });
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

function useApp() { return useContext(AppContext); }

// ─── Auth ──────────────────────────────────────────────────────────────────
function AuthPage() {
  const { dispatch } = useApp();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "user" });
  const [err, setErr] = useState("");
  const { state } = useApp();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const login = () => {
    const u = state.users.find(u => u.email === form.email && u.password === form.password);
    if (!u) return setErr("Invalid email or password");
    dispatch({ type: "LOGIN", user: u });
  };

  const register = () => {
    if (!form.name || !form.email || !form.phone || !form.password) return setErr("All fields are required");
    if (state.users.find(u => u.email === form.email)) return setErr("Email already registered");
    dispatch({ type: "REGISTER", user: form });
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>MediCare</h1>
          <p>Online Pharmacy & Delivery</p>
        </div>
        <div className="auth-tabs">
          <div className={`auth-tab${tab === "login" ? " active" : ""}`} onClick={() => { setTab("login"); setErr(""); }}>Sign In</div>
          <div className={`auth-tab${tab === "register" ? " active" : ""}`} onClick={() => { setTab("register"); setErr(""); }}>Register</div>
        </div>
        {err && <div className="alert alert-error">{err}</div>}
        {tab === "login" ? (
          <>
            <div className="form-group"><label className="form-label">Email</label><input className="form-control" value={form.email} onChange={set("email")} placeholder="you@example.com" /></div>
            <div className="form-group"><label className="form-label">Password</label><input className="form-control" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" /></div>
            <button className="btn btn-primary w-full mb-3" style={{ justifyContent: "center" }} onClick={login}>Sign In</button>
            <div className="hint" style={{ textAlign: "center" }}>Demo — admin@pharma.com / admin123 | pharmacist@pharma.com / pharma123 | user@pharma.com / user123</div>
          </>
        ) : (
          <>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-control" value={form.name} onChange={set("name")} placeholder="Your name" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Email</label><input className="form-control" value={form.email} onChange={set("email")} placeholder="you@example.com" /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={set("phone")} placeholder="10-digit number" /></div>
            </div>
            <div className="form-group"><label className="form-label">Password</label><input className="form-control" type="password" value={form.password} onChange={set("password")} placeholder="Min 6 characters" /></div>
            <button className="btn btn-primary w-full" style={{ justifyContent: "center" }} onClick={register}>Create Account</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────
function Sidebar() {
  const { state, dispatch } = useApp();
  const { currentUser, cart, view } = state;
  const nav = v => dispatch({ type: "SET_VIEW", view: v });
  const totalCartItems = cart.reduce((s, i) => s + i.qty, 0);

  const userNav = [
    { id: "dashboard", icon: "⊞", label: "Dashboard" },
    { id: "medicines", icon: "⬚", label: "Browse Medicines" },
    { id: "cart", icon: "◫", label: `Cart${totalCartItems > 0 ? ` (${totalCartItems})` : ""}` },
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
    { id: "dashboard", icon: "⊞", label: "Dashboard" },
    { id: "medicines", icon: "⬚", label: "Browse Medicines" },
    { id: "admin-orders", icon: "◳", label: "All Orders" },
    { id: "inventory", icon: "◰", label: "Inventory" },
  ];

  const navItems = currentUser?.role === "admin" ? adminNav : currentUser?.role === "pharmacist" ? pharmacistNav : userNav;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>MediCare</h1>
        <p>Pharmacy Management</p>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section">
          {navItems.map(item => (
            <div key={item.id} className={`nav-item${view === item.id ? " active" : ""}`} onClick={() => nav(item.id)}>
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
            <span className={`badge badge-${currentUser?.role}`}>{currentUser?.role}</span>
          </div>
          <button className="btn btn-ghost btn-xs" style={{ marginLeft: "auto" }} onClick={() => dispatch({ type: "LOGOUT" })}>↩</button>
        </div>
      </div>
    </aside>
  );
}

// ─── Dashboard (User) ──────────────────────────────────────────────────────
function UserDashboard() {
  const { state, dispatch } = useApp();
  const myOrders = state.orders.filter(o => o.userId === state.currentUser.id);
  const recent = myOrders.slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-semibold" style={{ fontSize: 20, marginBottom: 4 }}>Welcome back, {state.currentUser.name.split(" ")[0]} 👋</h2>
        <p className="text-muted">Here's an overview of your account.</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Orders</div><div className="stat-value">{myOrders.length}</div></div>
        <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value">{myOrders.filter(o => o.status !== "Delivered").length}</div></div>
        <div className="stat-card"><div className="stat-label">Delivered</div><div className="stat-value">{myOrders.filter(o => o.status === "Delivered").length}</div></div>
        <div className="stat-card"><div className="stat-label">Cart Items</div><div className="stat-value">{state.cart.reduce((s, i) => s + i.qty, 0)}</div></div>
      </div>
      <div className="card mb-5">
        <div className="card-header">
          <span className="card-title">Recent Orders</span>
          <button className="btn btn-outline btn-sm" onClick={() => dispatch({ type: "SET_VIEW", view: "orders" })}>View All</button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {recent.length === 0 ? <div className="empty"><p>No orders yet. Browse medicines to get started!</p></div> :
            <div className="table-wrap"><table>
              <thead><tr><th>Order ID</th><th>Date</th><th>Total</th><th>Status</th><th></th></tr></thead>
              <tbody>{recent.map(o => (
                <tr key={o.id}>
                  <td><span className="font-medium">{o.id}</span></td>
                  <td>{o.date}</td>
                  <td>₹{o.total}</td>
                  <td><span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span></td>
                  <td><button className="btn btn-ghost btn-xs" onClick={() => dispatch({ type: "SET_VIEW", view: "order-detail", data: o.id })}>Details →</button></td>
                </tr>
              ))}</tbody>
            </table></div>}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Quick Actions</span></div>
        <div className="card-body flex gap-3">
          <button className="btn btn-primary" onClick={() => dispatch({ type: "SET_VIEW", view: "medicines" })}>Browse Medicines</button>
          <button className="btn btn-outline" onClick={() => dispatch({ type: "SET_VIEW", view: "cart" })}>View Cart</button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ───────────────────────────────────────────────────────
function AdminDashboard() {
  const { state, dispatch } = useApp();
  const lowStock = state.medicines.filter(m => m.stock <= 15);
  const recentOrders = state.orders.slice(0, 6);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-semibold" style={{ fontSize: 20, marginBottom: 4 }}>Admin Dashboard</h2>
        <p className="text-muted">System overview & analytics</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Users</div><div className="stat-value">{state.users.length}</div><div className="stat-sub">Registered accounts</div></div>
        <div className="stat-card"><div className="stat-label">Total Orders</div><div className="stat-value">{state.orders.length}</div><div className="stat-sub">All time</div></div>
        <div className="stat-card"><div className="stat-label">Medicines</div><div className="stat-value">{state.medicines.length}</div><div className="stat-sub">In catalog</div></div>
        <div className="stat-card"><div className="stat-label">Low Stock</div><div className="stat-value" style={{ color: lowStock.length > 0 ? "var(--red)" : "inherit" }}>{lowStock.length}</div><div className="stat-sub">Need restock</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Orders</span><button className="btn btn-ghost btn-xs" onClick={() => dispatch({ type: "SET_VIEW", view: "admin-orders" })}>View all</button></div>
          <div style={{ padding: 0 }}>
            {recentOrders.map(o => {
              const u = state.users.find(u => u.id === o.userId);
              return (
                <div key={o.id} className="flex items-center justify-between" style={{ padding: "10px 20px", borderBottom: "1px solid var(--border)" }}>
                  <div><p className="font-medium" style={{ fontSize: 13 }}>{o.id}</p><p className="text-sm text-muted">{u?.name}</p></div>
                  <div className="flex items-center gap-2"><span className="font-medium">₹{o.total}</span><span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Low Stock Alerts</span></div>
          {lowStock.length === 0 ? <div className="empty" style={{ padding: 24 }}><p>All medicines well-stocked!</p></div> :
            lowStock.map(m => (
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

// ─── Medicines Browse ──────────────────────────────────────────────────────
function MedicinesPage() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [added, setAdded] = useState(null);

  const filtered = state.medicines.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = cat === "All" || m.category === cat;
    return matchSearch && matchCat;
  });

  const addToCart = (m) => {
    if (m.stock === 0) return;
    dispatch({ type: "ADD_TO_CART", item: { medId: m.id, name: m.name, price: m.price } });
    setAdded(m.id);
    setTimeout(() => setAdded(null), 1500);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="font-semibold" style={{ fontSize: 18 }}>Medicine Catalog</h2><p className="text-muted text-sm mt-1">{filtered.length} medicines available</p></div>
      </div>
      <div className="flex gap-3 mb-4">
        <div className="search-bar" style={{ flex: 1 }}>
          <span className="search-icon">⌕</span>
          <input className="form-control" placeholder="Search by medicine name or brand..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="chips">
        {CATEGORIES.map(c => <span key={c} className={`chip${cat === c ? " active" : ""}`} onClick={() => setCat(c)}>{c}</span>)}
      </div>
      {filtered.length === 0 ? <div className="empty"><div className="icon">⊘</div><p>No medicines found for your search.</p></div> :
        <div className="med-grid">
          {filtered.map(m => (
            <div key={m.id} className="med-card" onClick={() => dispatch({ type: "SET_VIEW", view: "med-detail", data: m.id })}>
              <div className="med-cat">{m.category}</div>
              <div className="med-name">{m.name}</div>
              <div className="med-brand">{m.brand}</div>
              {m.prescriptionRequired && <span className="badge" style={{ background: "var(--amber-light)", color: "var(--amber)", fontSize: 10, marginBottom: 8, display: "inline-block" }}>Rx Required</span>}
              <div className="med-footer">
                <div><div className="med-price">₹{m.price}</div><div className={`med-stock${m.stock <= 15 ? " stock-low" : ""}`}>{m.stock === 0 ? "Out of stock" : m.stock <= 15 ? `Only ${m.stock} left` : "In stock"}</div></div>
                {state.currentUser?.role === "user" && (
                  <button className={`btn btn-sm ${added === m.id ? "btn-outline" : "btn-primary"}`} style={{ fontSize: 12 }} disabled={m.stock === 0}
                    onClick={e => { e.stopPropagation(); addToCart(m); }}>
                    {added === m.id ? "Added ✓" : m.stock === 0 ? "Unavailable" : "+ Cart"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>}
    </div>
  );
}

// ─── Medicine Detail ───────────────────────────────────────────────────────
function MedDetailPage() {
  const { state, dispatch } = useApp();
  const med = state.medicines.find(m => m.id === state.viewData);
  const [added, setAdded] = useState(false);
  if (!med) return null;

  const addToCart = () => {
    dispatch({ type: "ADD_TO_CART", item: { medId: med.id, name: med.name, price: med.price } });
    setAdded(true); setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => dispatch({ type: "SET_VIEW", view: "medicines" })}>← Back to Catalog</button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-2">
              <span className="chip active" style={{ cursor: "default" }}>{med.category}</span>
              {med.prescriptionRequired && <span className="badge" style={{ background: "var(--amber-light)", color: "var(--amber)" }}>Rx Required</span>}
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
              <div className="stat-card"><div className="stat-label">Prescription</div><div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{med.prescriptionRequired ? "Required" : "Not Required"}</div></div>
            </div>
          </div>
        </div>
        <div>
          <div className="card mb-4">
            <div className="card-body">
              <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 4 }}>₹{med.price}</div>
              <p className={`hint mb-4 ${med.stock <= 15 ? "stock-low" : ""}`}>{med.stock === 0 ? "Out of stock" : med.stock <= 15 ? `Only ${med.stock} units left` : `${med.stock} units in stock`}</p>
              {state.currentUser?.role === "user" && (
                <button className={`btn w-full ${added ? "btn-outline" : "btn-primary"}`} style={{ justifyContent: "center" }} disabled={med.stock === 0} onClick={addToCart}>
                  {added ? "Added to Cart ✓" : med.stock === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              )}
              <button className="btn btn-outline w-full mt-2" style={{ justifyContent: "center" }} onClick={() => dispatch({ type: "SET_VIEW", view: state.currentUser?.role === "user" ? "cart" : "inventory" })}>
                {state.currentUser?.role === "user" ? "View Cart" : "Manage Inventory"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cart ────────────────────────────────────────────────────────────────
function CartPage() {
  const { state, dispatch } = useApp();
  const [address, setAddress] = useState("");
  const [placed, setPlaced] = useState(false);
  const total = state.cart.reduce((s, i) => s + i.price * i.qty, 0);

  const placeOrder = () => {
    if (!address.trim()) return;
    dispatch({ type: "PLACE_ORDER", address });
    setPlaced(true);
    setTimeout(() => { setPlaced(false); dispatch({ type: "SET_VIEW", view: "orders" }); }, 2000);
  };

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
      {state.cart.length === 0 ? (
        <div className="empty"><div className="icon">◫</div><p>Your cart is empty.</p><button className="btn btn-primary mt-4" onClick={() => dispatch({ type: "SET_VIEW", view: "medicines" })}>Browse Medicines</button></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">{state.cart.reduce((s, i) => s + i.qty, 0)} items</span></div>
            <div className="card-body" style={{ paddingTop: 0 }}>
              {state.cart.map(item => (
                <div key={item.medId} className="cart-item">
                  <div style={{ flex: 1 }}>
                    <p className="font-medium" style={{ fontSize: 13 }}>{item.name}</p>
                    <p className="text-sm text-muted">₹{item.price} each</p>
                  </div>
                  <div className="qty-ctrl">
                    <button className="qty-btn" onClick={() => dispatch({ type: "UPDATE_CART_QTY", medId: item.medId, qty: item.qty - 1 })}>−</button>
                    <span style={{ minWidth: 20, textAlign: "center", fontSize: 14, fontWeight: 500 }}>{item.qty}</span>
                    <button className="qty-btn" onClick={() => dispatch({ type: "UPDATE_CART_QTY", medId: item.medId, qty: item.qty + 1 })}>+</button>
                  </div>
                  <div style={{ width: 60, textAlign: "right", fontWeight: 600 }}>₹{item.price * item.qty}</div>
                  <button className="btn btn-ghost btn-xs" style={{ color: "var(--red)" }} onClick={() => dispatch({ type: "REMOVE_FROM_CART", medId: item.medId })}>✕</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="card mb-4">
              <div className="card-header"><span className="card-title">Order Summary</span></div>
              <div className="card-body">
                {state.cart.map(i => (
                  <div key={i.medId} className="flex justify-between mb-2" style={{ fontSize: 13 }}>
                    <span className="text-muted">{i.name} × {i.qty}</span><span>₹{i.price * i.qty}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 8 }}>
                  <div className="flex justify-between font-semibold"><span>Total</span><span>₹{total}</span></div>
                </div>
                <div className="form-group mt-4">
                  <label className="form-label">Delivery Address</label>
                  <textarea className="form-control" rows={3} placeholder="Enter your full delivery address..." value={address} onChange={e => setAddress(e.target.value)} />
                </div>
                <button className="btn btn-primary w-full mt-1" style={{ justifyContent: "center" }} disabled={!address.trim()} onClick={placeOrder}>Place Order</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Orders (User) ─────────────────────────────────────────────────────────
function OrdersPage() {
  const { state, dispatch } = useApp();
  const myOrders = state.orders.filter(o => o.userId === state.currentUser.id);

  return (
    <div>
      <h2 className="font-semibold mb-5" style={{ fontSize: 18 }}>Order History</h2>
      {myOrders.length === 0 ? <div className="empty"><div className="icon">◳</div><p>No orders yet.</p></div> :
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {myOrders.map(o => (
            <div key={o.id} className="card">
              <div className="card-body">
                <div className="flex items-center justify-between mb-3">
                  <div><span className="font-semibold">{o.id}</span><span className="text-muted text-sm" style={{ marginLeft: 10 }}>{o.date}</span></div>
                  <span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span>
                </div>
                <div style={{ marginBottom: 14 }}>
                  {o.items.map(i => <span key={i.medId} style={{ display: "inline-block", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "2px 8px", fontSize: 12, marginRight: 6, marginBottom: 4 }}>{i.name} × {i.qty}</span>)}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <OrderProgress status={o.status} />
                  </div>
                  <div className="text-right">
                    <div className="font-semibold" style={{ fontSize: 16 }}>₹{o.total}</div>
                    <button className="btn btn-ghost btn-xs mt-1" onClick={() => dispatch({ type: "SET_VIEW", view: "order-detail", data: o.id })}>View Details →</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>}
    </div>
  );
}

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

// ─── Order Detail ──────────────────────────────────────────────────────────
function OrderDetailPage() {
  const { state, dispatch } = useApp();
  const order = state.orders.find(o => o.id === state.viewData);
  if (!order) return null;
  const user = state.users.find(u => u.id === order.userId);

  const eta = order.status === "Placed" ? "2-3 days" : order.status === "Processing" ? "Tomorrow" : "Delivered";

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => dispatch({ type: "SET_VIEW", view: state.currentUser.role === "user" ? "orders" : "admin-orders" })}>← Back to Orders</button>
      <div className="card mb-4">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div><h2 className="font-semibold" style={{ fontSize: 18 }}>{order.id}</h2><p className="text-muted text-sm">{order.date}</p></div>
            <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span>
          </div>
          <div className="mb-5"><OrderProgress status={order.status} /></div>
          <div className="flex gap-3">
            <div className="stat-card" style={{ flex: 1 }}><div className="stat-label">Estimated Delivery</div><div className="stat-value" style={{ fontSize: 16 }}>{eta}</div></div>
            <div className="stat-card" style={{ flex: 1 }}><div className="stat-label">Customer</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>{user?.name}</div></div>
            <div className="stat-card" style={{ flex: 1 }}><div className="stat-label">Delivery To</div><div style={{ fontSize: 12, marginTop: 4, color: "var(--text2)" }}>{order.address}</div></div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Order Items</span></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Medicine</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
          <tbody>
            {order.items.map(i => (
              <tr key={i.medId}><td>{i.name}</td><td>{i.qty}</td><td>₹{i.price}</td><td className="font-medium">₹{i.price * i.qty}</td></tr>
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

// ─── Inventory (Admin) ─────────────────────────────────────────────────────
function MedicineModal({ med, onClose, onSave }) {
  const [form, setForm] = useState(med || { name: "", brand: "", category: "Antibiotics", price: "", stock: "", description: "", dosage: "", prescriptionRequired: false });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
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
                {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Dosage</label><input className="form-control" value={form.dosage} onChange={set("dosage")} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Price (₹)</label><input className="form-control" type="number" value={form.price} onChange={set("price")} /></div>
            <div className="form-group"><label className="form-label">Stock Quantity</label><input className="form-control" type="number" min={0} value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Math.max(0, parseInt(e.target.value) || 0) }))} /></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" rows={3} value={form.description} onChange={set("description")} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="rx" checked={form.prescriptionRequired} onChange={e => setForm(f => ({ ...f, prescriptionRequired: e.target.checked }))} />
            <label htmlFor="rx" className="form-label" style={{ margin: 0 }}>Prescription Required</label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Medicine</button>
        </div>
      </div>
    </div>
  );
}

function InventoryPage() {
  const { state, dispatch } = useApp();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = state.medicines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  const save = (form) => {
    if (modal === "new") dispatch({ type: "ADD_MEDICINE", med: { ...form, price: Number(form.price), stock: Number(form.stock) } });
    else dispatch({ type: "UPDATE_MEDICINE", med: { ...form, price: Number(form.price), stock: Number(form.stock) } });
    setModal(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="font-semibold" style={{ fontSize: 18 }}>Inventory Management</h2><p className="text-muted text-sm">{state.medicines.length} medicines in catalog</p></div>
        <button className="btn btn-primary" onClick={() => setModal("new")}>+ Add Medicine</button>
      </div>
      <div className="search-bar mb-4"><span className="search-icon">⌕</span><input className="form-control" placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="card">
        <div className="table-wrap"><table>
          <thead><tr><th>Name</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th>Rx</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td className="font-medium">{m.name}</td>
                <td className="text-muted">{m.brand}</td>
                <td><span className="chip" style={{ fontSize: 11, padding: "2px 8px", cursor: "default" }}>{m.category}</span></td>
                <td>₹{m.price}</td>
                <td><span style={{ color: m.stock === 0 ? "var(--red)" : m.stock <= 15 ? "var(--amber)" : "inherit", fontWeight: m.stock <= 15 ? 600 : 400 }}>{m.stock}</span></td>
                <td>{m.prescriptionRequired ? <span style={{ color: "var(--amber)", fontSize: 12, fontWeight: 600 }}>Rx</span> : <span className="text-muted">—</span>}</td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-outline btn-xs" onClick={() => setModal(m)}>Edit</button>
                    <button className="btn btn-danger btn-xs" onClick={() => { if (confirm(`Delete ${m.name}?`)) dispatch({ type: "DELETE_MEDICINE", id: m.id }); }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      {modal && <MedicineModal med={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}

// ─── Admin Orders ──────────────────────────────────────────────────────────
function AdminOrdersPage() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState("All");
  const statuses = ["All", "Placed", "Processing", "Delivered"];

  const filtered = filter === "All" ? state.orders : state.orders.filter(o => o.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div><h2 className="font-semibold" style={{ fontSize: 18 }}>All Orders</h2><p className="text-muted text-sm">{state.orders.length} total orders</p></div>
      </div>
      <div className="chips mb-4">
        {statuses.map(s => <span key={s} className={`chip${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}>{s}</span>)}
      </div>
      <div className="card">
        <div className="table-wrap"><table>
          <thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(o => {
              const u = state.users.find(u => u.id === o.userId);
              return (
                <tr key={o.id}>
                  <td className="font-medium">{o.id}</td>
                  <td>{u?.name || "Unknown"}</td>
                  <td className="text-muted">{o.date}</td>
                  <td className="text-muted text-sm">{o.items.length} item{o.items.length !== 1 ? "s" : ""}</td>
                  <td className="font-medium">₹{o.total}</td>
                  <td><span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-xs" onClick={() => dispatch({ type: "SET_VIEW", view: "order-detail", data: o.id })}>View</button>
                      <select className="form-control" style={{ padding: "3px 6px", fontSize: 11, height: "auto", width: "auto" }} value={o.status}
                        onChange={e => dispatch({ type: "UPDATE_ORDER_STATUS", id: o.id, status: e.target.value })}>
                        {["Placed", "Processing", "Delivered"].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}

// ─── Users page (Admin) ────────────────────────────────────────────────────
function UsersPage() {
  const { state } = useApp();
  return (
    <div>
      <div className="mb-5"><h2 className="font-semibold" style={{ fontSize: 18 }}>Registered Users</h2><p className="text-muted text-sm">{state.users.length} users in the system</p></div>
      <div className="card">
        <div className="table-wrap"><table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Orders</th></tr></thead>
          <tbody>
            {state.users.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{u.name.slice(0, 2).toUpperCase()}</div>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="text-muted">{u.email}</td>
                <td className="text-muted">{u.phone}</td>
                <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                <td>{state.orders.filter(o => o.userId === u.id).length}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}

// ─── Router ────────────────────────────────────────────────────────────────
function PageRouter() {
  const { state } = useApp();
  const { view, currentUser } = state;

  const isAdmin = currentUser?.role === "admin";
  const isPharmacist = currentUser?.role === "pharmacist";

  switch (view) {
    case "dashboard": return isAdmin ? <AdminDashboard /> : <UserDashboard />;
    case "admin-dashboard": return <AdminDashboard />;
    case "medicines": return <MedicinesPage />;
    case "med-detail": return <MedDetailPage />;
    case "cart": return <CartPage />;
    case "orders": return <OrdersPage />;
    case "order-detail": return <OrderDetailPage />;
    case "inventory": return <InventoryPage />;
    case "admin-orders": return <AdminOrdersPage />;
    case "users": return <UsersPage />;
    default: return <UserDashboard />;
  }
}

function getTopbarInfo(view, role) {
  const map = {
    dashboard: { title: "Dashboard", sub: "Your account overview" },
    "admin-dashboard": { title: "Admin Dashboard", sub: "System overview" },
    medicines: { title: "Browse Medicines", sub: "Search and explore our catalog" },
    "med-detail": { title: "Medicine Details", sub: "Detailed product information" },
    cart: { title: "Shopping Cart", sub: "Review and place your order" },
    orders: { title: "My Orders", sub: "Track and view your orders" },
    "order-detail": { title: "Order Details", sub: "Detailed order information" },
    inventory: { title: "Inventory Management", sub: "Manage medicine stock" },
    "admin-orders": { title: "All Orders", sub: "Manage and update orders" },
    users: { title: "Users", sub: "Registered accounts" },
  };
  return map[view] || { title: "MediCare", sub: "" };
}

// ─── Main App ──────────────────────────────────────────────────────────────
function App() {
  const { state } = useApp();
  if (!state.currentUser) return <AuthPage />;
  const { title, sub } = getTopbarInfo(state.view, state.currentUser.role);
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div><h2>{title}</h2><p>{sub}</p></div>
        </div>
        <div className="content"><PageRouter /></div>
      </div>
    </div>
  );
}

export default function Root() {
  return (
    <>
      <style>{CSS}</style>
      <AppProvider><App /></AppProvider>
    </>
  );
}