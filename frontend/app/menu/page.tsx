"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { motion, AnimatePresence, Variants } from "framer-motion";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
const HEARTBEAT_INTERVAL = 20 * 60 * 1000;
const RECEIPT_TTL_MS = 2 * 60 * 60 * 1000;

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  category: string | null;
}

interface CartItem extends MenuItem { quantity: number; }

type PaymentMethod = "ONLINE" | "OFFLINE";

interface ReceiptData {
  orderId: string;
  tableId: string;
  paymentId: string;
  razorpayOrderId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  paidAt: string;
  paymentStatus: "SUCCESS" | "PENDING" | "FAILED";
}

interface StoredReceipt {
  imageBase64: string;
  receiptData: ReceiptData;
  expiresAt: number;
}

type ModalState =
  | { type: "idle" }
  | { type: "session_expired" }
  | { type: "payment_choice" }
  | { type: "cart" }
  | { type: "ordering"; method: PaymentMethod }
  | { type: "success"; method: PaymentMethod; orderId: string }
  | { type: "receipt"; imageBase64: string; receiptData: ReceiptData };

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

// ─── Session helpers ──────────────────────────────────────────────────────────
function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sessionId");
}
function setSessionId(id: string) {
  localStorage.setItem("sessionId", id);
}

// ─── Receipt cache helpers ────────────────────────────────────────────────────
const RECEIPT_KEY_PREFIX = "receipt_v1_";

function saveReceiptToCache(orderId: string, stored: StoredReceipt) {
  try {
    localStorage.setItem(RECEIPT_KEY_PREFIX + orderId, JSON.stringify(stored));
  } catch { /* storage full */ }
}

function getLatestReceiptFromCache(): StoredReceipt | null {
  try {
    let latest: StoredReceipt | null = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(RECEIPT_KEY_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      let stored: StoredReceipt;
      try { stored = JSON.parse(raw); } catch { continue; }
      if (Date.now() > stored.expiresAt) {
        localStorage.removeItem(key);
        continue;
      }
      if (!latest || stored.receiptData.paidAt > latest.receiptData.paidAt) {
        latest = stored;
      }
    }
    return latest;
  } catch { return null; }
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  fillStyle: string | CanvasGradient,
  strokeStyle?: string,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawDashedLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number, color: string,
) {
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawBarcodeDecor(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
) {
  const bars = 28;
  const barW = w / bars;
  const shades = ["#3a2e1a", "#4a3a20", "#2e2410", "#4a3a20", "#3a2e1a"];
  for (let i = 0; i < bars; i++) {
    const barH = h * (0.4 + Math.sin(i * 1.3) * 0.4 + Math.cos(i * 0.7) * 0.2);
    ctx.fillStyle = shades[i % shades.length];
    ctx.fillRect(x + i * barW, y + (h - barH), barW - 1, barH);
  }
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (ctx.measureText(t + "…").width > maxW && t.length > 0) t = t.slice(0, -1);
  return t + "…";
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ─── Canvas receipt — dark bg, LIGHT readable text ───────────────────────────
async function generateReceiptImage(data: ReceiptData): Promise<string> {
  const W = 560;
  const PADDING = 36;
  const INNER = W - PADDING * 2;
  const ITEM_H = 32;
  const headerH = 230;
  const itemsH = data.items.reduce((acc, item) => acc + (item.quantity > 1 ? ITEM_H + 14 : ITEM_H), 16);
  const footerH = 230;
  const H = headerH + itemsH + footerH;

  const canvas = document.createElement("canvas");
  const DPR = 2;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(DPR, DPR);

  // Dark background
  const cardGrad = ctx.createLinearGradient(0, 0, 0, H);
  cardGrad.addColorStop(0, "#0f0b05");
  cardGrad.addColorStop(1, "#080603");
  roundRect(ctx, 0, 0, W, H, 20, cardGrad);

  // Top gold bar
  const barGrad = ctx.createLinearGradient(0, 0, W, 0);
  barGrad.addColorStop(0, "#c49a45");
  barGrad.addColorStop(0.5, "#e8c06a");
  barGrad.addColorStop(1, "#c49a45");
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, 0, W, 4);

  let y = 42;

  // ── Café name — bright gold, clearly visible ──
  ctx.font = "bold 30px Georgia, serif";
  ctx.fillStyle = "#f5d878";
  ctx.textAlign = "center";
  ctx.fillText("CAFFIQ", W / 2, y + 20);
  y += 38;

  ctx.font = "italic 12px Georgia, serif";
  ctx.fillStyle = "#c4944a";
  ctx.fillText("Artisan Coffee Experience", W / 2, y);
  y += 26;

  drawDashedLine(ctx, PADDING, y, W - PADDING, y, "#4a3820");
  y += 18;

  // RECEIPT label
  ctx.font = "10px 'Courier New', monospace";
  ctx.fillStyle = "#b08848";
  ctx.fillText("— PAYMENT RECEIPT —", W / 2, y);
  y += 26;

  // ── Meta rows — labels mid-tone, values bright ──
  const metaRows: [string, string, string][] = [
    ["Order Ref",   `#${data.orderId.slice(-8).toUpperCase()}`,  "#f0d070"],
    ["Table",       `Table ${data.tableId.slice(-4).toUpperCase()}`, "#f0d070"],
    ["Date & Time", formatTimestamp(data.paidAt),                "#d4b860"],
    ["Payment",
      data.paymentStatus === "SUCCESS" ? "✓ Paid Online" : data.paymentStatus,
      data.paymentStatus === "SUCCESS" ? "#80e880" : "#e88080"],
  ];

  for (const [label, value, valueColor] of metaRows) {
    ctx.textAlign = "left";
    ctx.font = "11px 'Courier New', monospace";
    ctx.fillStyle = "#a08850";        // label — warm readable mid-tone
    ctx.fillText(label, PADDING, y);

    ctx.textAlign = "right";
    ctx.fillStyle = valueColor;       // value — bright per type
    ctx.fillText(value, W - PADDING, y);
    y += 20;
  }

  y += 8;
  drawDashedLine(ctx, PADDING, y, W - PADDING, y, "#4a3820");
  y += 18;

  // ── Column headers — visible but dimmer than item rows ──
  ctx.textAlign = "left";
  ctx.font = "bold 10px 'Courier New', monospace";
  ctx.fillStyle = "#907848";
  ctx.fillText("ITEM", PADDING, y);
  ctx.textAlign = "center";
  ctx.fillText("QTY", W / 2 - 10, y);
  ctx.textAlign = "right";
  ctx.fillText("AMOUNT", W - PADDING, y);
  y += 14;

  drawDashedLine(ctx, PADDING, y, W - PADDING, y, "#382e10");
  y += 16;

  // ── Items ──
  for (const item of data.items) {
    const lineTotal = item.price * item.quantity;

    // Item name — brightest text on the receipt
    ctx.textAlign = "left";
    ctx.font = "13px Georgia, serif";
    ctx.fillStyle = "#f0e0b0";
    const truncName = truncateText(ctx, item.name, INNER * 0.55);
    ctx.fillText(truncName, PADDING, y);

    // Quantity
    ctx.textAlign = "center";
    ctx.font = "11px 'Courier New', monospace";
    ctx.fillStyle = "#c09850";
    ctx.fillText(`× ${item.quantity}`, W / 2 - 10, y);

    // Line total — bright gold
    ctx.textAlign = "right";
    ctx.font = "13px 'Courier New', monospace";
    ctx.fillStyle = "#f5c840";
    ctx.fillText(`₹${lineTotal.toFixed(2)}`, W - PADDING, y);

    // Unit price hint — subtle but not invisible
    if (item.quantity > 1) {
      ctx.textAlign = "right";
      ctx.font = "9px 'Courier New', monospace";
      ctx.fillStyle = "#806838";
      ctx.fillText(`₹${item.price.toFixed(2)} each`, W - PADDING, y + 13);
      y += ITEM_H + 14;
    } else {
      y += ITEM_H;
    }
  }

  y += 6;
  drawDashedLine(ctx, PADDING, y, W - PADDING, y, "#4a3820");
  y += 20;

  // ── Subtotal ──
  ctx.textAlign = "left";
  ctx.font = "11px 'Courier New', monospace";
  ctx.fillStyle = "#a08850";
  ctx.fillText("Subtotal", PADDING, y);
  ctx.textAlign = "right";
  ctx.fillStyle = "#d4a858";
  ctx.fillText(`₹${data.total.toFixed(2)}`, W - PADDING, y);
  y += 20;

  // Taxes
  ctx.textAlign = "left";
  ctx.font = "10px 'Courier New', monospace";
  ctx.fillStyle = "#806840";
  ctx.fillText("Taxes & charges", PADDING, y);
  ctx.textAlign = "right";
  ctx.fillStyle = "#806840";
  ctx.fillText("Included", W - PADDING, y);
  y += 22;

  // ── TOTAL box — most prominent element ──
  const totalBoxY = y - 4;
  const totalBoxH = 44;
  const totalBoxGrad = ctx.createLinearGradient(PADDING, 0, W - PADDING, 0);
  totalBoxGrad.addColorStop(0, "rgba(196,154,69,0.22)");
  totalBoxGrad.addColorStop(1, "rgba(196,154,69,0.10)");
  roundRect(ctx, PADDING, totalBoxY, INNER, totalBoxH, 8, totalBoxGrad, "rgba(230,180,60,0.40)");

  ctx.textAlign = "left";
  ctx.font = "bold 15px Georgia, serif";
  ctx.fillStyle = "#f5d870";
  ctx.fillText("TOTAL PAID", PADDING + 14, y + 22);

  ctx.textAlign = "right";
  ctx.font = "bold 22px Georgia, serif";
  ctx.fillStyle = "#ffe878";          // brightest element on receipt
  ctx.fillText(`₹${data.total.toFixed(2)}`, W - PADDING - 14, y + 23);
  y += totalBoxH + 22;

  // ── Payment IDs ──
  drawDashedLine(ctx, PADDING, y, W - PADDING, y, "#382e10");
  y += 16;

  const idRows: [string, string][] = [
    ["RAZORPAY PAYMENT ID", data.paymentId],
    ["RAZORPAY ORDER ID",   data.razorpayOrderId],
  ];
  for (const [label, value] of idRows) {
    ctx.textAlign = "left";
    ctx.font = "9px 'Courier New', monospace";
    ctx.fillStyle = "#806840";        // label dim
    ctx.fillText(label, PADDING, y);
    y += 13;

    ctx.font = "10px 'Courier New', monospace";
    ctx.fillStyle = "#c09050";        // value — readable warm gold
    ctx.fillText(value, PADDING, y);
    y += 18;
  }

  y += 6;
  drawDashedLine(ctx, PADDING, y, W - PADDING, y, "#382e10");
  y += 22;

  // ── Footer ──
  ctx.textAlign = "center";
  ctx.font = "italic 12px Georgia, serif";
  ctx.fillStyle = "#a08050";
  ctx.fillText("Thank you for visiting Caffiq.", W / 2, y);
  y += 18;

  ctx.font = "10px 'Courier New', monospace";
  ctx.fillStyle = "#706040";
  ctx.fillText("Every cup brewed with precision & passion.", W / 2, y);
  y += 26;

  drawBarcodeDecor(ctx, W / 2 - 70, y, 140, 20);
  y += 32;

  ctx.font = "8px 'Courier New', monospace";
  ctx.fillStyle = "#604830";
  ctx.fillText(`Generated ${new Date().toLocaleString("en-IN")}`, W / 2, y);

  return canvas.toDataURL("image/png");
}

// ─── Misc ─────────────────────────────────────────────────────────────────────
function groupByCategory(items: MenuItem[]): Record<string, MenuItem[]> {
  return items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const cat = item.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
}

type ToastType = "success" | "error" | "info";
interface ToastItem { id: number; msg: string; type: ToastType }

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const add = useCallback((msg: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

const toastCls: Record<ToastType, string> = {
  success: "border-[#c49a45]/50 bg-[#c49a45]/10 text-[#ffd28c]",
  error:   "border-red-500/40 bg-red-500/10 text-red-400",
  info:    "border-[#2a1e0a] bg-[#0d0b07] text-[#d4a762]/50",
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: "easeOut", delay: i * 0.06 },
  }),
};

const modalAnim: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.38, ease: "easeOut" } },
  exit: { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.22 } },
};

const backdropAnim: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// ─── Backdrop ─────────────────────────────────────────────────────────────────
function Backdrop({
  children,
  onClose,
  wide = false,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <motion.div
      variants={backdropAnim}
      initial="hidden" animate="show" exit="exit"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        variants={modalAnim}
        onClick={(e) => e.stopPropagation()}
        className="w-full"
        style={{ maxWidth: wide ? "580px" : "420px" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Cart Badge ───────────────────────────────────────────────────────────────
function CartBadge({ count, total, onClick }: { count: number; total: number; onClick: () => void }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.94 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileTap={{ scale: 0.96 }}
          onClick={onClick}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-full text-black whitespace-nowrap"
          style={{
            background: "linear-gradient(90deg, #c49a45, #d4a762)",
            boxShadow: "0 8px 32px rgba(196,154,69,0.45)",
          }}
        >
          <span className="w-6 h-6 bg-black/20 rounded-full text-xs font-bold grid place-items-center shrink-0">{count}</span>
          <span className="text-sm font-semibold tracking-wide">View Cart</span>
          <span className="text-sm font-bold">₹{total}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ─── Receipt Banner — fixed bottom strip ─────────────────────────────────────
// Replaces the old top-right floating button. Sits at the very bottom of the
// viewport, below the cart badge (z-30 < z-40). Slides up from bottom.
function ReceiptBanner({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 60 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-3.5"
      style={{
        background: "linear-gradient(90deg, #0f0b05 0%, #1c1408 50%, #0f0b05 100%)",
        borderTop: "1px solid rgba(196,154,69,0.22)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.6)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "rgba(196,154,69,0.12)", border: "1px solid rgba(196,154,69,0.28)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4a762" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div>
          <p className="text-[#d4a762] text-xs font-semibold leading-tight">Collect your receipt</p>
          <p className="text-[#7a5e30] text-[10px] font-mono leading-tight tracking-wide">Payment confirmed · tap to view &amp; download</p>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.94 }}
        whileHover={{ scale: 1.04 }}
        onClick={onClick}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-black text-xs font-bold tracking-wide shrink-0"
        style={{
          background: "linear-gradient(90deg, #c49a45, #e0b855)",
          boxShadow: "0 2px 12px rgba(196,154,69,0.35)",
        }}
      >
        View
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </motion.button>
    </motion.div>
  );
}

// ─── Receipt Modal content ────────────────────────────────────────────────────
// FIX: This component renders the card content only.
// The Backdrop is applied exactly once at the call site in AnimatePresence.
function ReceiptModalContent({
  imageBase64,
  receiptData,
  onClose,
}: {
  imageBase64: string;
  receiptData: ReceiptData;
  onClose: () => void;
}) {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = imageBase64;
    a.download = `caffiq-receipt-${receiptData.orderId.slice(-8).toUpperCase()}.png`;
    a.click();
  };

  const card = {
    background: "#080603",
    border: "1px solid #1e1508",
    boxShadow: "0 24px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(196,154,69,0.06)",
  };

  return (
    <div className="rounded-2xl flex flex-col overflow-hidden" style={{ ...card, maxHeight: "88vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#1e1508] shrink-0">
        <div className="flex flex-col gap-0.5">
          <p className="text-[#d4a762] text-xs tracking-[0.22em] uppercase font-mono">Payment Confirmed</p>
          <h3 className="text-white text-xl font-serif">Your Receipt</h3>
        </div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={onClose}
          className="w-8 h-8 rounded-full border border-[#2a1e0a] flex items-center justify-center text-gray-500 hover:text-[#d4a762] hover:border-[#c49a45]/40 transition shrink-0"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </motion.button>
      </div>

      {/* Scrollable receipt image */}
      <div
        className="flex-1 overflow-y-auto min-h-0 px-4 py-4"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#2a1e0a transparent" }}
      >
        <img
          src={imageBase64}
          alt="Payment receipt"
          className="w-full rounded-xl"
          style={{ border: "1px solid #2a1e0a" }}
        />
      </div>

      {/* Footer actions */}
      <div className="shrink-0 px-5 pb-5 pt-4 border-t border-[#1e1508] flex flex-col gap-3 bg-[#080603]">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "rgba(126,200,126,0.06)", border: "1px solid rgba(126,200,126,0.12)" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7ec87e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span className="text-[#7ec87e] text-xs font-mono">
            Payment successful · ₹{receiptData.total.toFixed(2)} paid
          </span>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleDownload}
            className="flex-1 py-3 rounded-full text-sm font-semibold tracking-wide flex items-center justify-center gap-2 text-black"
            style={{ background: "linear-gradient(90deg, #c49a45, #d4a762)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download PNG
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="px-5 py-3 rounded-full text-sm font-semibold tracking-wide border border-[#2a1e0a] text-[#d4a762]/60 hover:border-[#c49a45]/30 hover:text-[#d4a762] transition"
          >
            Close
          </motion.button>
        </div>
        <p className="text-[#3a2a10] text-center text-xs font-mono">
          Cached for 2 hrs · {formatTimestamp(receiptData.paidAt)}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function MenuPage() {
  const searchParams = useSearchParams();
  const tableId = searchParams.get("tableId");

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modal, setModal] = useState<ModalState>({ type: "idle" });
  const [cachedReceipt, setCachedReceipt] = useState<StoredReceipt | null>(null);
  const { toasts, add: addToast } = useToast();
  const sessionStartedRef = useRef(false);

  // Load cached receipt on mount
  useEffect(() => {
    const stored = getLatestReceiptFromCache();
    if (stored) setCachedReceipt(stored);
  }, []);

  // ── 1. Start session ─────────────────────────────────────────────────────────
useEffect(() => {
  if (!tableId || sessionStartedRef.current) return;
  sessionStartedRef.current = true;

  const startSession = async () => {
    try {
      // Always clear the old sessionId before starting a new one
      localStorage.removeItem('sessionId');        // ← ADD THIS

      const res = await fetch(`${BASE_URL}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { id: string };
      setSessionId(data.id);                       // sets the fresh one
    } catch {
      addToast('Could not start session. Please rescan.', 'error');
    }
  };

  void startSession();
}, [tableId, addToast]);

  // ── 2. Heartbeat ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tableId) return;
    const interval = setInterval(async () => {
      const sessionId = getSessionId();
      if (!sessionId) return;
      try {
        await fetch(`${BASE_URL}/session/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      } catch { /* silent */ }
    }, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [tableId]);

  // ── 3. Fetch menu ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchMenu = async () => {
      setLoadingMenu(true);
      try {
        const res = await fetch(`${BASE_URL}/orders/menu-items`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as MenuItem[];
        setMenuItems(data);
      } catch {
        addToast("Failed to load menu. Please refresh.", "error");
      } finally {
        setLoadingMenu(false);
      }
    };
    void fetchMenu();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const addToCart = (item: MenuItem) => {
    if (!tableId) {
      addToast("Scan the QR code on your table to place an order.", "error");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
    addToast(`${item.name} added`, "success");
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((c) => c.id !== id);
      return prev.map((c) => c.id === id ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const handleCheckout = () => {
    const sessionId = getSessionId();
    if (!sessionId) { setModal({ type: "session_expired" }); return; }
    setModal({ type: "payment_choice" });
  };

  // ── Generate + cache receipt ─────────────────────────────────────────────
  const generateAndCacheReceipt = useCallback(async (receiptData: ReceiptData) => {
    try {
      const imageBase64 = await generateReceiptImage(receiptData);
      const stored: StoredReceipt = {
        imageBase64,
        receiptData,
        expiresAt: Date.now() + RECEIPT_TTL_MS,
      };
      saveReceiptToCache(receiptData.orderId, stored);
      setCachedReceipt(stored);
      return { imageBase64, stored };
    } catch {
      addToast("Receipt generation failed. Order still placed.", "info");
      return null;
    }
  }, [addToast]);

  // ── Place order ──────────────────────────────────────────────────────────
  const placeOrder = async (method: PaymentMethod) => {
    const sessionId = getSessionId();
    if (!sessionId) { setModal({ type: "session_expired" }); return; }

    setModal({ type: "ordering", method });

    try {
      if (method === "OFFLINE") {
        const res = await fetch(`${BASE_URL}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId, tableId,
            paymentMethod: "OFFLINE",
            items: cart.map((c) => ({ menuItemId: c.id, quantity: c.quantity })),
          }),
        });
        if (!res.ok) {
          const err = await res.json() as { message?: string };
          if (err.message === "SESSION_EXPIRED") { setModal({ type: "session_expired" }); return; }
          throw new Error(err.message ?? "Order failed");
        }
        const order = await res.json() as { id: string };
        setCart([]);
        setModal({ type: "success", method: "OFFLINE", orderId: order.id });
        return;
      }

      // ── ONLINE: Razorpay ────────────────────────────────────────────────
      const payRes = await fetch(`${BASE_URL}/payments/create-razorpay-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cartTotal }),
      });
      if (!payRes.ok) throw new Error("Payment init failed");
      const payData = await payRes.json() as {
        razorpayOrderId: string;
        amount: number;
        currency: string;
        key: string;
      };

      const cartSnapshot = cart.map((c) => ({ menuItemId: c.id, quantity: c.quantity }));
      const cartForReceipt = cart.map((c) => ({ name: c.name, quantity: c.quantity, price: c.price }));
      const totalSnapshot = cartTotal;

      const rzp = new window.Razorpay({
        key: payData.key ?? RAZORPAY_KEY,
        amount: payData.amount,
        currency: payData.currency,
        order_id: payData.razorpayOrderId,
        name: "Caffiq",
        description: "Table order",
        theme: { color: "#c49a45" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch(`${BASE_URL}/payments/verify-and-create`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, sessionId, tableId, items: cartSnapshot }),
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json() as { message?: string };
              // PENDING receipt even on verify failure — proof of payment for staff
              const receiptData: ReceiptData = {
                orderId: response.razorpay_order_id,
                tableId: tableId ?? "unknown",
                paymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                items: cartForReceipt,
                total: totalSnapshot,
                paidAt: new Date().toISOString(),
                paymentStatus: "PENDING",
              };
              await generateAndCacheReceipt(receiptData);
              addToast(
                err.message === "SESSION_EXPIRED_AFTER_PAYMENT"
                  ? "Payment done but session expired. Show this to staff."
                  : "Payment done but order failed. Show screenshot to staff.",
                "error"
              );
              setModal({ type: "idle" });
              return;
            }

            const data = await verifyRes.json() as { orderId: string };
            const receiptData: ReceiptData = {
              orderId: data.orderId,
              tableId: tableId ?? "unknown",
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              items: cartForReceipt,
              total: totalSnapshot,
              paidAt: new Date().toISOString(),
              paymentStatus: "SUCCESS",
            };

            const result = await generateAndCacheReceipt(receiptData);
            setCart([]);

            if (result) {
              setModal({ type: "receipt", imageBase64: result.imageBase64, receiptData });
            } else {
              setModal({ type: "success", method: "ONLINE", orderId: data.orderId });
            }
          } catch {
            addToast("Verification failed. Show payment screenshot to staff.", "error");
            setModal({ type: "idle" });
          }
        },
        modal: {
          ondismiss: () => {
            addToast("Payment cancelled.", "info");
            setModal({ type: "idle" });
          },
        },
      });
      rzp.open();
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Something went wrong", "error");
      setModal({ type: "idle" });
    }
  };

  const grouped = groupByCategory(menuItems);
  const categoryMeta: Record<string, { tag: string }> = {
    Espresso: { tag: "Bold & Pure" },
    Latte:    { tag: "Smooth & Creamy" },
    Cold:     { tag: "Chilled & Bold" },
    Food:     { tag: "To Eat" },
    Other:    { tag: "More" },
  };

  const card = {
    background: "#080603",
    border: "1px solid #1e1508",
    boxShadow: "0 24px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(196,154,69,0.06)",
  };

  // Banner visible when there's a cached receipt AND no modal open
  const showReceiptBanner = !!cachedReceipt && modal.type === "idle";

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

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
        .cart-scroll::-webkit-scrollbar { width: 4px; }
        .cart-scroll::-webkit-scrollbar-track { background: transparent; }
        .cart-scroll::-webkit-scrollbar-thumb { background: #2a1e0a; border-radius: 99px; }
        .cart-scroll::-webkit-scrollbar-thumb:hover { background: #c49a45; }
      `}</style>

      {/* Extra padding at bottom when banner is visible so content isn't hidden */}
      <div className="min-h-screen w-full bg-black pt-20" style={{ paddingBottom: showReceiptBanner ? "64px" : "0" }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 xl:px-30">

          {/* ── Hero ── */}
          <motion.div
            className="pt-10 pb-10 sm:pb-14 max-w-3xl"
            initial="hidden" animate="show"
            variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          >
            <motion.p variants={fadeUp} className="text-[#d4a762] text-xs tracking-[0.25em] uppercase mb-3 font-mono">
              Artisan Coffee Experience
            </motion.p>
            <motion.h1 variants={fadeUp} className="text-white text-4xl sm:text-5xl lg:text-6xl font-serif leading-tight mb-5">
              Our Menu
            </motion.h1>
            <motion.p variants={fadeUp} className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Every cup on this list is brewed with precision, passion, and a touch of elegance.
            </motion.p>
          </motion.div>

          {/* ── Divider ── */}
          <motion.div
            className="w-full h-px"
            style={{ background: "linear-gradient(90deg, #c49a45 0%, #1e1508 55%, transparent 100%)" }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />

          {/* ── Menu sections ── */}
          <div className="py-10 sm:py-14 flex flex-col gap-12 sm:gap-16">
            {loadingMenu ? (
              Array.from({ length: 3 }).map((_, si) => (
                <div key={si} className="flex flex-col gap-4">
                  <div className="h-7 w-36 bg-[#1a1208] rounded-lg animate-pulse" />
                  {Array.from({ length: 4 }).map((_, ii) => (
                    <div key={ii} className="flex justify-between py-5 border-b border-[#1a1208]">
                      <div className="flex flex-col gap-2">
                        <div className="h-4 w-32 bg-[#1a1208] rounded animate-pulse" />
                        <div className="h-3 w-48 bg-[#1a1208] rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-16 bg-[#1a1208] rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ))
            ) : Object.keys(grouped).length === 0 ? (
              <motion.p variants={fadeUp} initial="hidden" animate="show"
                className="text-gray-600 text-center py-20">
                No items available right now.
              </motion.p>
            ) : (
              Object.entries(grouped).map(([category, items], si) => {
                const meta = categoryMeta[category] ?? { tag: "Selection" };
                return (
                  <motion.div
                    key={si}
                    initial="hidden" whileInView="show"
                    viewport={{ once: true, margin: "-60px" }}
                    variants={{ show: { transition: { staggerChildren: 0.07 } } }}
                  >
                    <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-3 mb-5 sm:mb-7">
                      <div>
                        <p className="text-[#d4a762] text-xs tracking-[0.2em] uppercase mb-1 font-mono">{meta.tag}</p>
                        <h2 className="text-white text-2xl sm:text-3xl font-serif italic">{category}</h2>
                      </div>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="hidden sm:block h-px w-28"
                          style={{ background: "linear-gradient(90deg, #2a1e0a, transparent)" }} />
                        <span className="text-gray-600 text-xs">{items.length} items</span>
                      </div>
                    </motion.div>

                    <div className="flex flex-col divide-y divide-[#150f05]">
                      {items.map((item, ii) => {
                        const inCart = cart.find((c) => c.id === item.id);
                        return (
                          <motion.div
                            key={ii}
                            custom={ii}
                            variants={fadeUp}
                            className="flex items-center justify-between gap-4 py-4 group hover:bg-[#0d0a05] -mx-3 px-3 rounded-xl transition"
                          >
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-gray-200 text-sm sm:text-base font-medium group-hover:text-[#d4a762] transition-colors truncate">
                                {item.name}
                              </span>
                              {item.description && (
                                <span className="text-gray-500 text-xs italic line-clamp-1">{item.description}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                              <span className="text-[#c49a45] text-sm sm:text-base font-semibold">₹{item.price}</span>
                              <AnimatePresence mode="wait">
                                {inCart ? (
                                  <motion.div
                                    key="stepper"
                                    initial={{ opacity: 0, scale: 0.88 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.88 }}
                                    transition={{ duration: 0.18 }}
                                    className="flex items-center gap-1.5 sm:gap-2"
                                  >
                                    <motion.button whileTap={{ scale: 0.85 }}
                                      onClick={() => removeFromCart(item.id)}
                                      className="w-7 h-7 rounded-full border border-[#2a1e0a] text-[#d4a762]/50 hover:border-[#c49a45] hover:text-[#c49a45] text-base leading-none grid place-items-center transition"
                                    >−</motion.button>
                                    <span className="text-gray-200 text-sm font-bold w-5 text-center tabular-nums">
                                      {inCart.quantity}
                                    </span>
                                    <motion.button whileTap={{ scale: 0.85 }}
                                      onClick={() => addToCart(item)}
                                      className="w-7 h-7 rounded-full text-black text-base leading-none grid place-items-center transition"
                                      style={{ background: "#c49a45" }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = "#d4a762")}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = "#c49a45")}
                                    >+</motion.button>
                                  </motion.div>
                                ) : (
                                  <motion.button
                                    key="add"
                                    initial={{ opacity: 0, scale: 0.88 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.88 }}
                                    transition={{ duration: 0.18 }}
                                    whileTap={{ scale: 0.93 }}
                                    onClick={() => addToCart(item)}
                                    className="px-3 py-1.5 border border-[#2a1e0a] hover:border-[#c49a45] hover:text-[#c49a45] text-[#d4a762]/40 text-xs rounded-full transition tracking-widest"
                                  >
                                    ADD
                                  </motion.button>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
        <div className="h-28" />
      </div>

      {/* ── Receipt banner (bottom strip, z-30) ── */}
      <AnimatePresence>
        {showReceiptBanner && (
          <ReceiptBanner
            onClick={() =>
              setModal({
                type: "receipt",
                imageBase64: cachedReceipt!.imageBase64,
                receiptData: cachedReceipt!.receiptData,
              })
            }
          />
        )}
      </AnimatePresence>

      {/* ── Cart badge (z-40, sits above banner) ── */}
      <CartBadge count={cartCount} total={cartTotal} onClick={() => setModal({ type: "cart" })} />

      {/* ══ MODALS ══ */}
      <AnimatePresence>

        {modal.type === "session_expired" && (
          <Backdrop key="session-expired">
            <div className="rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-5 text-center" style={card}>
              <div className="w-12 h-12 rounded-full border border-[#c49a45]/20 flex items-center justify-center"
                style={{ background: "radial-gradient(circle, rgba(196,154,69,0.1) 0%, transparent 70%)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c49a45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-white text-lg sm:text-xl font-serif">Session Expired</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Your session has timed out. Please rescan the QR code on your table to continue.
                </p>
              </div>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => {
  localStorage.removeItem("sessionId");
  setModal({ type: "idle" });
}}
  className="btn-gold w-full py-3 rounded-full text-sm font-semibold tracking-wide">
  Understood
</motion.button>
            </div>
          </Backdrop>
        )}

        {modal.type === "cart" && (
          <Backdrop key="cart" onClose={() => setModal({ type: "idle" })}>
            <div className="rounded-2xl flex flex-col overflow-hidden" style={{ ...card, maxHeight: "80vh" }}>
              <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-[#1e1508] shrink-0">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[#d4a762] text-xs tracking-[0.22em] uppercase font-mono">Your Order</p>
                  <h3 className="text-white text-xl font-serif">Cart</h3>
                </div>
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setModal({ type: "idle" })}
                  className="w-8 h-8 rounded-full border border-[#2a1e0a] flex items-center justify-center text-gray-500 hover:text-[#d4a762] hover:border-[#c49a45]/40 transition shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </motion.button>
              </div>
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14 px-6">
                  <div className="w-11 h-11 rounded-full border border-[#2a1e0a] flex items-center justify-center"
                    style={{ background: "radial-gradient(circle, rgba(196,154,69,0.05) 0%, transparent 70%)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c49a45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm">Your cart is empty.</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto cart-scroll px-5 sm:px-6 min-h-0">
                    <AnimatePresence initial={false}>
                      {cart.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22 }}
                          className="flex items-center justify-between gap-4 py-3.5 border-b border-[#150f05] last:border-b-0"
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <p className="text-gray-200 text-sm font-medium truncate">{item.name}</p>
                            <p className="text-[#c49a45]/50 text-xs font-mono">₹{item.price} × {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <motion.button whileTap={{ scale: 0.85 }} onClick={() => removeFromCart(item.id)}
                              className="w-7 h-7 rounded-full border border-[#2a1e0a] text-gray-500 hover:border-red-900/60 hover:text-red-400 text-sm grid place-items-center transition">−</motion.button>
                            <span className="text-gray-200 text-xs font-bold w-5 text-center tabular-nums">{item.quantity}</span>
                            <motion.button whileTap={{ scale: 0.85 }} onClick={() => addToCart(item)}
                              className="w-7 h-7 rounded-full text-black text-sm grid place-items-center transition"
                              style={{ background: "#c49a45" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#d4a762")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "#c49a45")}>+</motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <div className="shrink-0 px-5 sm:px-6 pt-4 pb-5 sm:pb-6 border-t border-[#1e1508] flex flex-col gap-4 bg-[#080603]">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">Total Amount</span>
                      <span className="text-[#d4a762] text-2xl font-serif">₹{cartTotal}</span>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={handleCheckout}
                      className="btn-gold w-full py-3.5 rounded-full font-semibold text-sm tracking-wider">
                      Proceed to Checkout →
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </Backdrop>
        )}

        {modal.type === "payment_choice" && (
          <Backdrop key="payment-choice" onClose={() => setModal({ type: "idle" })}>
            <div className="rounded-2xl overflow-hidden" style={card}>
              <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #c49a45, transparent)" }} />
              <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-5 sm:pb-6 flex flex-col gap-5">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[#d4a762] text-xs tracking-[0.22em] uppercase font-mono">Settle Your Bill</p>
                  <h3 className="text-white text-xl font-serif">Payment Method</h3>
                </div>
                <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: "rgba(196,154,69,0.06)", border: "1px solid rgba(196,154,69,0.14)" }}>
                  <span className="text-gray-400 text-sm">Order Total</span>
                  <span className="text-[#d4a762] text-xl font-serif">₹{cartTotal}</span>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => void placeOrder("ONLINE")}
                  className="btn-gold w-full px-5 py-4 rounded-xl flex items-center justify-between">
                  <div className="flex flex-col items-start gap-0.5 text-left">
                    <span className="text-xs font-normal opacity-60 tracking-widest uppercase">Instant</span>
                    <span className="font-semibold text-sm sm:text-base">Pay Online</span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-75 text-xs">
                    <span>UPI · Card · Wallet</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => void placeOrder("OFFLINE")}
                  className="btn-outline w-full px-5 py-4 rounded-xl flex items-center justify-between">
                  <div className="flex flex-col items-start gap-0.5 text-left">
                    <span className="text-xs font-normal opacity-50 tracking-widest uppercase">At Counter</span>
                    <span className="font-semibold text-sm sm:text-base">Pay with Cash</span>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </motion.button>
                <button onClick={() => setModal({ type: "idle" })}
                  className="text-gray-600 text-xs text-center hover:text-gray-400 transition pt-1">
                  Cancel
                </button>
              </div>
            </div>
          </Backdrop>
        )}

        {modal.type === "ordering" && (
          <Backdrop key="ordering">
            <div className="rounded-2xl p-10 flex flex-col items-center gap-4" style={card}>
              <div className="w-9 h-9 border-2 border-[#c49a45] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm tracking-wide">Placing your order…</p>
            </div>
          </Backdrop>
        )}

        {modal.type === "success" && (
          <Backdrop key="success">
            <div className="rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-5 text-center" style={card}>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                className="w-14 h-14 rounded-full border border-[#c49a45]/25 flex items-center justify-center"
                style={{ background: "radial-gradient(circle, rgba(196,154,69,0.12) 0%, transparent 70%)" }}
              >
                <motion.svg
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                  width="26" height="26" viewBox="0 0 24 24" fill="none"
                  stroke="#c49a45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <motion.polyline points="20 6 9 17 4 12" />
                </motion.svg>
              </motion.div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-white text-lg sm:text-xl font-serif">Order Confirmed</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {modal.method === "ONLINE"
                    ? "Payment received. Your order is being prepared with care."
                    : "Your order is placed. Please settle at the counter when ready."}
                </p>
              </div>
              <div className="w-full px-4 py-2.5 rounded-xl"
                style={{ background: "rgba(196,154,69,0.06)", border: "1px solid rgba(196,154,69,0.1)" }}>
                <p className="text-[#d4a762]/40 text-xs font-mono tracking-[0.18em] uppercase mb-0.5">Order Reference</p>
                <p className="text-[#d4a762] text-sm font-mono tracking-widest">
                  #{modal.orderId.slice(-8).toUpperCase()}
                </p>
              </div>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setModal({ type: "idle" })}
                className="btn-gold w-full py-3.5 rounded-full text-sm font-semibold tracking-wide">
                Back to Menu
              </motion.button>
            </div>
          </Backdrop>
        )}

        {/* ── Receipt — single Backdrop, ReceiptModalContent inside ── */}
        {modal.type === "receipt" && (
          <Backdrop key="receipt" onClose={() => setModal({ type: "idle" })} wide>
            <ReceiptModalContent
              imageBase64={modal.imageBase64}
              receiptData={modal.receiptData}
              onClose={() => setModal({ type: "idle" })}
            />
          </Backdrop>
        )}

      </AnimatePresence>

      {/* ── Toasts ── */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-2 z-50 pointer-events-none"
        style={{ maxWidth: "min(280px, calc(100vw - 2rem))" }}>
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.94 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={`px-4 py-3 rounded-xl border text-xs tracking-wide font-mono ${toastCls[t.type]}`}
            >
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MenuPage />
    </Suspense>
  );
}