/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
  category?: string;
  createdAt?: string;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  isAvailable: true,
  category: "",
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: "easeOut",
      delay: i * 0.06,
    },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addForm, setAddForm] = useState({ ...EMPTY_FORM });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BASE_URL}/menu/get-all`);
      if (!res.ok) throw new Error("Failed to fetch menu items");
      const data: MenuItem[] = await res.json();
      setItems(data);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const grouped: Record<string, MenuItem[]> = {};
  for (const item of items) {
    const cat = item.category || "Uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  const handleAdd = async () => {
    if (!addForm.name || !addForm.price) { setAddError("Name and price are required."); return; }
    try {
      setAdding(true); setAddError(null);
      const res = await fetch(`${BASE_URL}/menu/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          description: addForm.description || undefined,
          price: parseFloat(addForm.price),
          isAvailable: addForm.isAvailable,
          category: addForm.category || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      setAddForm({ ...EMPTY_FORM });
      await fetchItems();
    } catch (e: any) {
      setAddError(e.message ?? "Failed to add item");
    } finally { setAdding(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await fetch(`${BASE_URL}/menu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchItems();
    } catch { /* silently fail */ } finally { setDeletingId(null); }
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setEditForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      isAvailable: item.isAvailable ?? true,
      category: item.category ?? "",
    });
    setEditError(null);
  };

  const handleEditSubmit = async () => {
    if (!editItem) return;
    if (!editForm.name || !editForm.price) { setEditError("Name and price are required."); return; }
    try {
      setEditLoading(true); setEditError(null);
      const res = await fetch(`${BASE_URL}/menu/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description || undefined,
          price: parseFloat(editForm.price),
          isAvailable: editForm.isAvailable,
          category: editForm.category || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to update item");
      setEditItem(null);
      await fetchItems();
    } catch (e: any) {
      setEditError(e.message ?? "Failed to update");
    } finally { setEditLoading(false); }
  };

  const inputCls =
    "bg-[#080603] border border-[#1e1508] text-[#e8d5b0] text-sm rounded-lg px-3 py-2 w-full placeholder:text-[#d4a762]/20 focus:outline-none focus:border-[#c49a45]/60 transition-colors duration-200";

  return (
    <>
      <style>{`
        @keyframes shimmerBtn {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .btn-gold {
          background: linear-gradient(90deg, #c49a45 35%, #e8c06a 50%, #c49a45 65%);
          background-size: 200% auto;
          color: #000;
          transition: background-position .4s, box-shadow .3s, transform .2s;
        }
        .btn-gold:hover {
          animation: shimmerBtn .9s linear;
          box-shadow: 0 6px 28px rgba(196,154,69,0.5);
          transform: translateY(-1px) scale(1.02);
        }
        .btn-gold:active { transform: scale(.97); }
        .btn-outline {
          border: 1px solid rgba(196,154,69,0.25);
          color: #d4a762;
          background: transparent;
          transition: border-color .2s, background .2s, transform .2s;
        }
        .btn-outline:hover {
          border-color: rgba(196,154,69,0.55);
          background: rgba(196,154,69,0.06);
          transform: translateY(-1px);
        }
        .btn-outline:active { transform: scale(.97); }
      `}</style>

      <div className="min-h-screen w-full bg-black pt-20">

        {/* ── Centered container matching customer menu page ── */}
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 xl:px-30">

          {/* ── HERO ── */}
          <motion.div
            className="pt-10 pb-12 sm:pb-16 max-w-3xl"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          >
            <motion.p variants={fadeUp} className="text-[#d4a762] text-xs tracking-[0.25em] uppercase mb-4 font-mono">
              Artisan Coffee Experience
            </motion.p>
            <motion.h1 variants={fadeUp} className="text-white text-4xl sm:text-5xl lg:text-6xl font-serif leading-tight mb-6">
              Our Menu
            </motion.h1>
            <motion.p variants={fadeUp} className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Every cup on this list is brewed with precision, passion, and a touch of elegance.
              From bold espresso pulls to slow cold brews — there&apos;s something for every mood.
            </motion.p>
          </motion.div>

          {/* ── DIVIDER ── */}
          <motion.div
            className="w-full h-px"
            style={{ background: "linear-gradient(90deg, #c49a45 0%, #1e1508 55%, transparent 100%)" }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />

          {/* ── MENU SECTIONS ── */}
          <div className="py-12 sm:py-16 flex flex-col gap-14 sm:gap-20">

            {loading && (
              <motion.p variants={fadeIn} initial="hidden" animate="show"
                className="text-[#d4a762]/30 text-sm italic">
                Loading menu...
              </motion.p>
            )}
            {error && (
              <motion.p variants={fadeIn} initial="hidden" animate="show"
                className="text-red-400/70 text-sm italic">{error}</motion.p>
            )}
            {!loading && !error && Object.keys(grouped).length === 0 && (
              <motion.p variants={fadeIn} initial="hidden" animate="show"
                className="text-gray-600 text-sm italic">
                No menu items yet. Add one below.
              </motion.p>
            )}

            {!loading && !error && Object.entries(grouped).map(([category, catItems], si) => (
              <motion.div
                key={si}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                variants={{ show: { transition: { staggerChildren: 0.07 } } }}
              >
                {/* Section header */}
                <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-3 mb-6 sm:mb-8">
                  <div>
                    <p className="text-[#d4a762] text-xs tracking-[0.2em] uppercase mb-1 font-mono">
                      {catItems[0]?.isAvailable !== false ? "Available" : "Unavailable"}
                    </p>
                    <h2 className="text-white text-3xl sm:text-4xl font-serif italic">{category}</h2>
                  </div>
                  <div className="flex items-center gap-4 mb-1">
                    <div className="hidden sm:block h-px w-24 sm:w-40"
                      style={{ background: "linear-gradient(90deg, #2a1e0a, transparent)" }} />
                    <span className="text-gray-600 text-sm">{catItems.length} items</span>
                  </div>
                </motion.div>

                {/* Items */}
                <div className="flex flex-col divide-y divide-[#150f05]">
                  {catItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      custom={idx}
                      variants={fadeUp}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-5 group hover:bg-[#0d0a05] -mx-3 sm:-mx-4 px-3 sm:px-4 rounded-xl transition-colors duration-200"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-200 text-base font-medium tracking-wide group-hover:text-[#d4a762] transition-colors duration-200">
                          {item.name}
                          {item.isAvailable === false && (
                            <span className="ml-2 text-xs text-gray-600 italic">(unavailable)</span>
                          )}
                        </span>
                        <span className="text-gray-500 text-sm italic">{item.description}</span>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-4 shrink-0 sm:ml-8">
                        <span className="text-[#c49a45] text-base font-semibold min-w-13 sm:text-right">
                          ₹{item.price}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          onClick={() => openEdit(item)}
                          className="btn-outline text-xs rounded-lg px-3 py-1.5"
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="text-gray-600 hover:text-red-400 text-xs border border-[#1e1508] hover:border-red-500/30 rounded-lg px-3 py-1.5 transition-all duration-200 disabled:opacity-40"
                        >
                          {deletingId === item.id ? "..." : "Delete"}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── DIVIDER ── */}
          <div className="w-full h-px"
            style={{ background: "linear-gradient(90deg, #c49a45 0%, #1e1508 55%, transparent 100%)" }} />

          {/* ── ADD ITEM ── */}
          <motion.div
            className="py-12 sm:py-16"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} className="mb-6 sm:mb-8">
              <p className="text-[#d4a762] text-xs tracking-[0.2em] uppercase mb-1 font-mono">Manage</p>
              <h2 className="text-white text-3xl sm:text-4xl font-serif italic">Add a New Item</h2>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-[#d4a762]/50 text-xs uppercase tracking-widest block mb-1.5">Name *</label>
                <input className={inputCls} placeholder="e.g. Cortado"
                  value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-[#d4a762]/50 text-xs uppercase tracking-widest block mb-1.5">Price (₹) *</label>
                <input className={inputCls} type="number" placeholder="e.g. 200"
                  value={addForm.price} onChange={(e) => setAddForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="text-[#d4a762]/50 text-xs uppercase tracking-widest block mb-1.5">Category</label>
                <input className={inputCls} placeholder="e.g. Espresso"
                  value={addForm.category} onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-[#d4a762]/50 text-xs uppercase tracking-widest block mb-1.5">Description</label>
                <input className={inputCls} placeholder="e.g. Equal parts espresso & steamed milk"
                  value={addForm.description} onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
            </motion.div>

            {/* ── Fixed toggle ── */}
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => setAddForm((f) => ({ ...f, isAvailable: !f.isAvailable }))}
                style={{
                  position: "relative",
                  width: "44px",
                  height: "24px",
                  borderRadius: "9999px",
                  background: addForm.isAvailable ? "#c49a45" : "#1e1508",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    left: addForm.isAvailable ? "24px" : "4px",
                    width: "16px",
                    height: "16px",
                    background: "white",
                    borderRadius: "50%",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    transition: "left 0.2s",
                  }}
                />
              </button>
              <span className="text-gray-500 text-sm">Available</span>
            </motion.div>

            {addError && (
              <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="text-red-400/70 text-sm mb-4 italic">{addError}</motion.p>
            )}

            <motion.button
              variants={fadeUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAdd}
              disabled={adding}
              className="btn-gold text-sm font-semibold px-6 py-2.5 rounded-full tracking-wide transition-all duration-200 disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add to Menu"}
            </motion.button>
          </motion.div>

        </div>{/* end centered container */}

      </div>

      {/* ── EDIT MODAL ── */}
      <AnimatePresence>
        {editItem && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setEditItem(null); }}
          >
            <motion.div
              key="modal-card"
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 sm:p-8"
              style={{
                background: "#080603",
                border: "1px solid #1e1508",
                boxShadow: "0 24px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(196,154,69,0.06)",
              }}
            >
              {/* Top accent line */}
              <div className="h-0.5 w-full -mt-6 sm:-mt-8 mb-6 sm:mb-8 -mx-6 sm:-mx-8 px-0"
                style={{ background: "linear-gradient(90deg, #c49a45, transparent)", width: "calc(100% + 3rem)" }} />

              <div className="mb-6">
                <p className="text-[#d4a762] text-xs tracking-[0.2em] uppercase mb-1 font-mono">Edit</p>
                <h3 className="text-white text-2xl font-serif italic">{editItem.name}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="text-[#d4a762]/50 text-xs uppercase tracking-widest block mb-1.5">Name *</label>
                  <input className={inputCls} value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[#d4a762]/50 text-xs uppercase tracking-widest block mb-1.5">Price (₹) *</label>
                  <input className={inputCls} type="number" value={editForm.price}
                    onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[#d4a762]/50 text-xs uppercase tracking-widest block mb-1.5">Category</label>
                  <input className={inputCls} value={editForm.category}
                    onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[#d4a762]/50 text-xs uppercase tracking-widest block mb-1.5">Description</label>
                  <input className={inputCls} value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
              </div>

              {/* ── Fixed toggle ── */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setEditForm((f) => ({ ...f, isAvailable: !f.isAvailable }))}
                  style={{
                    position: "relative",
                    width: "44px",
                    height: "24px",
                    borderRadius: "9999px",
                    background: editForm.isAvailable ? "#c49a45" : "#1e1508",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "4px",
                      left: editForm.isAvailable ? "24px" : "4px",
                      width: "16px",
                      height: "16px",
                      background: "white",
                      borderRadius: "50%",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      transition: "left 0.2s",
                    }}
                  />
                </button>
                <span className="text-gray-500 text-sm">Available</span>
              </div>

              {editError && (
                <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="text-red-400/70 text-sm mb-4 italic">{editError}</motion.p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleEditSubmit}
                  disabled={editLoading}
                  className="btn-gold text-sm font-semibold px-5 py-2.5 rounded-full tracking-wide disabled:opacity-50"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setEditItem(null)}
                  className="btn-outline text-sm px-5 py-2.5 rounded-full"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}