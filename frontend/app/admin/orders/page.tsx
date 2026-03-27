'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

type OrderStatus = 'PLACED' | 'PREPARING' | 'SERVED' | 'CANCELLED';

interface MenuItem {
  id: string;
  name: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  priceAtTime: number;
  menuItem: MenuItem;
}

interface Payment {
  id: string;
  status: string;
  method: string;
}

interface Order {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  createdAt: string;
  items: OrderItem[];
  payment?: Payment;
  table: {
    id: string;
    tableNumber: number;
  };
}

type ConfirmState =
  | { type: 'idle' }
  | { type: 'confirm'; orderId: string; newStatus: OrderStatus };

const STATUS_META: Record<OrderStatus, { label: string; color: string; dot: string; bg: string }> = {
  PLACED: { label: 'Placed', color: 'text-[#d4a762]', dot: 'bg-[#d4a762]', bg: 'rgba(196,154,69,0.08)' },
  PREPARING: { label: 'Preparing', color: 'text-amber-400', dot: 'bg-amber-400', bg: 'rgba(251,191,36,0.08)' },
  SERVED: { label: 'Served', color: 'text-emerald-400', dot: 'bg-emerald-400', bg: 'rgba(52,211,153,0.08)' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400', dot: 'bg-red-500', bg: 'rgba(239,68,68,0.08)' },
};

const ACTION_BUTTONS: { status: OrderStatus; label: string; style: 'gold' | 'outline' | 'danger' }[] = [
  { status: 'PREPARING', label: 'Mark Preparing', style: 'gold' },
  { status: 'SERVED', label: 'Mark Served', style: 'outline' },
  { status: 'CANCELLED', label: 'Cancel Order', style: 'danger' },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      delay: i * 0.07,
    },
  }),
};

const modalAnim: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: 16,
    scale: 0.97,
    transition: { duration: 0.2 },
  },
};

const backdropAnim = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmState>({ type: 'idle' });
  const [updating, setUpdating] = useState<string | null>(null);
  const [servedOrders, setServedOrders] = useState<Order[]>([]);
  const [timeframe, setTimeframe] = useState<number | ''>(60);
  const [servedError, setServedError] = useState<string | null>(null);
  const [servedLoading, setServedLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/all-orders`);
      const data = await res.json() as Order[];
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServedOrders = async (minutes: number) => {
    try {
      setServedLoading(true);
      setServedError(null);

      const res = await fetch(`${API_BASE}/orders/served/${minutes}`);

      if (!res.ok) {
        const text = await res.text();
        setServedError(text || 'Failed to fetch served orders');
        setServedOrders([]);
        return;
      }

      const data = await res.json() as Order[];
      setServedOrders(data);

    } catch (err) {
      setServedError('Network error');
      setServedOrders([]);
    } finally {
      setServedLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    if (timeframe !== '') fetchServedOrders(timeframe);
  }, []);

  const requestUpdate = (orderId: string, status: OrderStatus) => {
    setConfirm({ type: 'confirm', orderId, newStatus: status });
  };

  const confirmUpdate = async () => {
    if (confirm.type !== 'confirm') return;
    const { orderId, newStatus } = confirm;
    setConfirm({ type: 'idle' });
    setUpdating(orderId);
    try {
      await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdating(null);
    }
  };

  // ── Stats
  const total = orders.length;
  const placed = orders.filter(o => o.status === 'PLACED').length;
  const preparing = orders.filter(o => o.status === 'PREPARING').length;
  const served = orders.filter(o => o.status === 'SERVED').length;

  return (
    <>
      <style>{`
        @keyframes shimmerBar {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-bar {
          background: linear-gradient(90deg, #c49a45 30%, #ffd28c 50%, #c49a45 70%);
          background-size: 200% auto;
          animation: shimmerBar 3s linear infinite;
        }
        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.5; transform:scale(1.3); }
        }
        .pulse-dot { animation: pulseDot 2s ease-in-out infinite; }
        .gold-btn {
          background: linear-gradient(90deg, #c49a45, #d4a762);
          box-shadow: 0 4px 20px rgba(196,154,69,0.3);
          transition: transform .2s, box-shadow .2s;
        }
        .gold-btn:hover { transform: translateY(-1px) scale(1.02); box-shadow: 0 6px 28px rgba(196,154,69,0.45); }
        .gold-btn:active { transform: scale(.97); }
        .outline-btn {
          border: 1px solid rgba(196,154,69,0.25);
          color: #d4a762;
          transition: border-color .2s, background .2s, transform .2s;
        }
        .outline-btn:hover { border-color: rgba(196,154,69,0.6); background: rgba(196,154,69,0.06); transform: translateY(-1px); }
        .outline-btn:active { transform: scale(.97); }
        .danger-btn {
          border: 1px solid rgba(239,68,68,0.2);
          color: #f87171;
          transition: border-color .2s, background .2s, transform .2s;
        }
        .danger-btn:hover { border-color: rgba(239,68,68,0.5); background: rgba(239,68,68,0.06); transform: translateY(-1px); }
        .danger-btn:active { transform: scale(.97); }
        .order-card {
          background: #080603;
          border: 1px solid #1e1508;
          transition: border-color .3s, box-shadow .3s;
        }
        .order-card:hover { border-color: rgba(196,154,69,0.2); box-shadow: 0 8px 40px rgba(0,0,0,0.5); }
        .noise-overlay {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 180px;
        }
      `}</style>

      <div className="relative min-h-screen w-full bg-black overflow-x-hidden pt-24">

        {/* Ambient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(196,154,69,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-40 left-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(196,154,69,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        {/* Noise */}
        <div className="absolute inset-0 pointer-events-none z-0 noise-overlay opacity-60" />

        <div className="relative z-10 px-6 sm:px-10 lg:px-16 xl:px-24 pt-16 pb-24 max-w-6xl mx-auto">

          {/* ── Page header ── */}
          <motion.div
            className="flex flex-col gap-3 mb-12"
            initial="hidden" animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.p variants={fadeUp} className="text-[#d4a762] text-xs tracking-[0.25em] uppercase font-mono">
              Staff Dashboard
            </motion.p>
            <motion.h1 variants={fadeUp} className="text-white text-4xl sm:text-5xl font-serif leading-tight">
              Live Orders
            </motion.h1>
            <motion.div variants={fadeUp} className="shimmer-bar h-px w-24 rounded-full mt-1" />
          </motion.div>

          {/* ── Stats row ── */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-12"
            initial="hidden" animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            {[
              { label: 'Total', value: total, color: 'text-gray-300' },
              { label: 'Placed', value: placed, color: 'text-[#d4a762]' },
              { label: 'Preparing', value: preparing, color: 'text-amber-400' },
              { label: 'Served', value: served, color: 'text-emerald-400' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                custom={i}
                variants={fadeUp}
                className="rounded-2xl px-5 py-4 flex flex-col gap-1"
                style={{ background: '#080603', border: '1px solid #1e1508' }}
              >
                <span className={`text-2xl font-serif font-bold ${s.color}`}>{s.value}</span>
                <span className="text-gray-600 text-xs tracking-widest uppercase">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Divider ── */}
          <motion.div
            className="w-full h-px mb-10"
            style={{ background: 'linear-gradient(90deg, #c49a45 0%, #1e1508 60%)' }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          />

          {/* ── Orders list ── */}
          {loading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: '#080603', border: '1px solid #1e1508' }}>
                  <div className="h-4 w-40 bg-[#1e1508] rounded mb-3" />
                  <div className="h-3 w-64 bg-[#1e1508] rounded mb-2" />
                  <div className="h-3 w-48 bg-[#1e1508] rounded" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-3 py-24"
            >
              <div className="w-14 h-14 rounded-full border border-[#2a1e0a] flex items-center justify-center"
                style={{ background: 'radial-gradient(circle, rgba(196,154,69,0.06) 0%, transparent 70%)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c49a45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="2" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
                </svg>
              </div>
              <p className="text-gray-600 text-sm">No orders yet.</p>
            </motion.div>
          ) : (
            <motion.div
              className="flex flex-col gap-4"
              initial="hidden" animate="show"
              variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            >
              {orders.map((order, idx) => {
                const meta = STATUS_META[order.status];
                const isUpd = updating === order.id;
                const isDone = order.status === 'SERVED' || order.status === 'CANCELLED';

                return (
                  <motion.div
                    key={order.id}
                    custom={idx}
                    variants={fadeUp}
                    layout
                    className="order-card rounded-2xl overflow-hidden"
                    style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
                  >
                    {/* Top accent bar */}
                    <div className="h-px w-full" style={{
                      background: isDone
                        ? 'linear-gradient(90deg, #1e1508, transparent)'
                        : 'linear-gradient(90deg, #c49a45, #1e1508)'
                    }} />

                    <div className="p-5 sm:p-6">

                      {/* ── Card header ── */}
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <p className="text-gray-300 text-sm font-mono tracking-widest">
                              Table {order.table.tableNumber}
                            </p>
                            {/* Status badge */}
                            <span
                              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.color}`}
                              style={{ background: meta.bg }}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${order.status === 'PREPARING' ? 'pulse-dot' : ''}`} />
                              {meta.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 text-xs">
                            <span>{formatDate(order.createdAt)}</span>
                            <span>·</span>
                            <span>{formatTime(order.createdAt)}</span>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="text-right">
                          <p className="text-[#d4a762] text-xl font-serif">₹{order.totalPrice}</p>
                          {order.payment && (
                            <p className="text-gray-600 text-xs mt-0.5 uppercase tracking-widest">
                              {order.payment.method} · {order.payment.status}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ── Items ── */}
                      <div className="flex flex-col gap-1.5 mb-5 pl-1 border-l border-[#1e1508]">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between px-3">
                            <span className="text-gray-300 text-sm">
                              {item.menuItem.name}
                              <span className="text-gray-600 ml-2 text-xs">× {item.quantity}</span>
                            </span>
                            <span className="text-[#c49a45]/70 text-xs font-mono">
                              ₹{item.priceAtTime * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* ── Action buttons ── */}
                      {!isDone && (
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-[#1e1508]">
                          {isUpd ? (
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                              <div className="w-4 h-4 border border-[#c49a45] border-t-transparent rounded-full animate-spin" />
                              <span>Updating…</span>
                            </div>
                          ) : (
                            ACTION_BUTTONS.map(({ status, label, style }) => {
                              if (status === order.status) return null;
                              return (
                                <motion.button
                                  key={status}
                                  whileTap={{ scale: 0.96 }}
                                  onClick={() => requestUpdate(order.id, status)}
                                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide ${style === 'gold' ? 'gold-btn text-black' :
                                      style === 'outline' ? 'outline-btn' :
                                        'danger-btn'
                                    }`}
                                >
                                  {label}
                                </motion.button>
                              );
                            })
                          )}
                        </div>
                      )}

                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ── Served Orders Section ── */}
          <motion.div
            className="mt-20"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          >
            {/* Section header */}
            <motion.div variants={fadeUp} className="flex flex-col gap-3 mb-8">
              <p className="text-[#d4a762] text-xs tracking-[0.25em] uppercase font-mono">History</p>
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-white text-3xl sm:text-4xl font-serif leading-tight">Served Orders</h2>

                {/* Timeframe input */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-600 text-xs tracking-widest uppercase">Last</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={timeframe}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setTimeframe('');
                        return;
                      }
                      if (/^[1-9]\d*$/.test(value)) {
                        const num = Number(value);
                        if (num > 1440) return;
                        setTimeframe(num);
                        fetchServedOrders(num);
                      }
                    }}
                    className="w-16 bg-[#080603] border border-[#1e1508] text-[#d4a762] text-sm px-2 py-1 rounded-md focus:outline-none focus:border-[#c49a45] text-center font-mono"
                  />
                  <span className="text-gray-600 text-xs tracking-widest uppercase">min</span>
                </div>
              </div>
              <div className="shimmer-bar h-px w-24 rounded-full" style={{
                background: 'linear-gradient(90deg, #1e1508 0%, #c49a45 100%)',
                animation: 'none'
              }} />
            </motion.div>

            {/* Divider */}
            <motion.div
              className="w-full h-px mb-10"
              style={{ background: 'linear-gradient(90deg, #1e1508 0%, #c49a45 100%)' }}
              initial={{ scaleX: 0, originX: 1 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            />

            {/* Content */}
            {servedLoading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: '#080603', border: '1px solid #1e1508' }}>
                    <div className="h-4 w-40 bg-[#1e1508] rounded mb-3" />
                    <div className="h-3 w-64 bg-[#1e1508] rounded mb-2" />
                    <div className="h-3 w-48 bg-[#1e1508] rounded" />
                  </div>
                ))}
              </div>
            ) : servedError ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-3 py-16"
              >
                <p className="text-red-400/60 text-sm">{servedError}</p>
              </motion.div>
            ) : servedOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-3 py-16"
              >
                <div className="w-14 h-14 rounded-full border border-[#2a1e0a] flex items-center justify-center"
                  style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="2" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">No served orders in this period.</p>
              </motion.div>
            ) : (
              <motion.div
                className="flex flex-col gap-4"
                initial="hidden" animate="show"
                variants={{ show: { transition: { staggerChildren: 0.07 } } }}
              >
                {servedOrders.map((order, idx) => (
                  <motion.div
                    key={order.id}
                    custom={idx}
                    variants={fadeUp}
                    layout
                    className="order-card rounded-2xl overflow-hidden"
                    style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)', opacity: 0.85 }}
                  >
                    {/* Top accent bar — emerald tint for served */}
                    <div className="h-px w-full" style={{
                      background: 'linear-gradient(90deg, rgba(52,211,153,0.4), #1e1508)'
                    }} />

                    <div className="p-5 sm:p-6">

                      {/* ── Card header ── */}
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <p className="text-gray-300 text-sm font-mono tracking-widest">
                              Table {order.table.tableNumber}
                            </p>
                            <span
                              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-emerald-400"
                              style={{ background: 'rgba(52,211,153,0.08)' }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Served
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 text-xs">
                            <span>{formatDate(order.createdAt)}</span>
                            <span>·</span>
                            <span>{formatTime(order.createdAt)}</span>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="text-right">
                          <p className="text-emerald-400 text-xl font-serif">₹{order.totalPrice}</p>
                          {order.payment && (
                            <p className="text-gray-600 text-xs mt-0.5 uppercase tracking-widest">
                              {order.payment.method} · {order.payment.status}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* ── Items ── */}
                      <div className="flex flex-col gap-1.5 pl-1 border-l border-[#1e1508]">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between px-3">
                            <span className="text-gray-400 text-sm">
                              {item.menuItem.name}
                              <span className="text-gray-600 ml-2 text-xs">× {item.quantity}</span>
                            </span>
                            <span className="text-emerald-400/50 text-xs font-mono">
                              ₹{item.priceAtTime * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>

      {/* ── Confirmation modal ── */}
      <AnimatePresence>
        {confirm.type === 'confirm' && (
          <motion.div
            variants={backdropAnim}
            initial="hidden" animate="show" exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-4"
            onClick={() => setConfirm({ type: 'idle' })}
          >
            <motion.div
              variants={modalAnim}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
              style={{
                background: '#080603',
                border: '1px solid #1e1508',
                boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(196,154,69,0.07)',
              }}
            >
              {/* Icon */}
              <div className="mx-auto w-12 h-12 rounded-full border border-[#c49a45]/20 flex items-center justify-center"
                style={{ background: 'radial-gradient(circle, rgba(196,154,69,0.1) 0%, transparent 70%)' }}>
                {confirm.newStatus === 'CANCELLED' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c49a45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                )}
              </div>

              <div className="text-center flex flex-col gap-1.5">
                <h3 className="text-white text-lg font-serif">Confirm Action</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Mark order{' '}
                  <span className="text-[#d4a762] font-mono">
                    #{confirm.orderId.slice(-8).toUpperCase()}
                  </span>{' '}
                  as{' '}
                  <span className={confirm.newStatus === 'CANCELLED' ? 'text-red-400' : 'text-emerald-400'}>
                    {STATUS_META[confirm.newStatus].label}
                  </span>
                  ?
                </p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setConfirm({ type: 'idle' })}
                  className="flex-1 py-3 rounded-full text-sm outline-btn font-semibold"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={confirmUpdate}
                  className={`flex-1 py-3 rounded-full text-sm font-semibold ${confirm.newStatus === 'CANCELLED'
                      ? 'danger-btn'
                      : 'gold-btn text-black'
                    }`}
                >
                  Confirm
                </motion.button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}