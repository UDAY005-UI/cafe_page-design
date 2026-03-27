'use client';
import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import type { NextPage } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────
interface QrItem {
  tableNumber: number;
  qr: string;
}

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((msg: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return { toasts, add };
}

const toastStyles: Record<ToastType, string> = {
  success: "border-[#c49a45] bg-[#c49a45]/10 text-[#d4a762]",
  error: "border-[#7a3020] bg-[#7a3020]/10 text-[#e07060]",
  info: "border-[#7a5c2a] bg-[#7a5c2a]/10 text-[#ffd28c]",
};

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-8 right-8 flex flex-col gap-2 z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl border text-xs tracking-wide max-w-xs animate-slide-in font-mono ${toastStyles[t.type]}`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-3 flex flex-col items-center gap-3"
      style={{
        background: "var(--surface2)",
        border: "1px solid rgba(196,154,69,0.18)",
      }}
    >
      <div className="w-full aspect-square rounded-xl animate-pulse" style={{ background: "var(--border)" }} />
      <div className="h-3 w-3/5 rounded animate-pulse" style={{ background: "var(--border)" }} />
      <div className="h-2 w-2/5 rounded animate-pulse" style={{ background: "var(--border)" }} />
    </div>
  );
}

// ─── QR Card ──────────────────────────────────────────────────────────────────
interface QrCardProps {
  qr: QrItem;
  index: number;
  onSelect: (tableNumber: number) => void;
  onDelete: (tableNumber: number) => void;
  deleting: boolean;
}

function QrCard({ qr, index, onSelect, onDelete, deleting }: QrCardProps) {
  const handleDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${qr.qr}`;
    a.download = `table-${qr.tableNumber}-qr.png`;
    a.click();
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDelete(qr.tableNumber);
  };

  return (
    <div
      onClick={() => onSelect(qr.tableNumber)}
      className="group relative rounded-2xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "var(--surface2)",
        border: "1px solid rgba(196,154,69,0.22)",
        boxShadow: "0 0 10px rgba(196,154,69,0.08), inset 0 0 0 1px rgba(196,154,69,0.04)",
        animationDelay: `${index * 40}ms`,
        opacity: deleting ? 0.4 : 1,
        pointerEvents: deleting ? "none" : "auto",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(196,154,69,0.7)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 18px rgba(196,154,69,0.35), 0 0 6px rgba(212,167,98,0.2), inset 0 0 0 1px rgba(196,154,69,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(196,154,69,0.22)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 10px rgba(196,154,69,0.08), inset 0 0 0 1px rgba(196,154,69,0.04)";
      }}
    >
      {/* Download button — top left */}
      <button
        onClick={handleDownload}
        className="absolute top-2 left-2 w-6 h-6 rounded-md grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        style={{ background: "rgba(30,120,60,0.85)", color: "#fff" }}
        title="Download"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>

      {/* Delete button — top right */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 w-6 h-6 rounded-md grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        style={{ background: "rgba(180,50,30,0.85)", color: "#fff" }}
        title="Delete"
      >
        {deleting ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        )}
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/png;base64,${qr.qr}`}
        alt={`Table ${qr.tableNumber}`}
        className="w-full aspect-square object-contain rounded-lg p-1"
        style={{ background: "var(--off-white)" }}
      />
      <span className="font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif", color: "var(--off-white-dim)" }}>
        T{qr.tableNumber}
      </span>
      <span className="text-[9px] tracking-[2px] uppercase" style={{ color: "var(--gold-muted)" }}>Table</span>
    </div>
  );
}

// ─── QR Preview Placeholder ───────────────────────────────────────────────────
function QrPlaceholder() {
  const dots: { x: number; y: number }[] = [
    { x: 36, y: 36 }, { x: 46, y: 36 }, { x: 56, y: 36 },
    { x: 36, y: 46 }, { x: 46, y: 46 },
    { x: 36, y: 56 }, { x: 46, y: 56 }, { x: 56, y: 56 },
  ];

  return (
    <div className="flex flex-col items-center gap-3 opacity-30">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="3" stroke="#c49a45" strokeWidth="2.5" />
        <rect x="10" y="10" width="12" height="12" rx="1" fill="#c49a45" />
        <rect x="36" y="4" width="24" height="24" rx="3" stroke="#c49a45" strokeWidth="2.5" />
        <rect x="42" y="10" width="12" height="12" rx="1" fill="#c49a45" />
        <rect x="4" y="36" width="24" height="24" rx="3" stroke="#c49a45" strokeWidth="2.5" />
        <rect x="10" y="42" width="12" height="12" rx="1" fill="#c49a45" />
        {dots.map((d, i) => (
          <rect key={i} x={d.x} y={d.y} width="6" height="6" fill="#c49a45" />
        ))}
      </svg>
      <span className="text-xs tracking-[2px] font-mono" style={{ color: "var(--gold-muted)" }}>PREVIEW</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const QrDashboard: NextPage = () => {
  const [tableNumber, setTableNumber] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentBlob, setCurrentBlob] = useState<Blob | null>(null);
  const [currentTableNum, setCurrentTableNum] = useState<number | null>(null);
  const [allQrs, setAllQrs] = useState<QrItem[]>([]);
  const [filteredQrs, setFilteredQrs] = useState<QrItem[]>([]);
  const [loadingQrs, setLoadingQrs] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [deletingTables, setDeletingTables] = useState<Set<number>>(new Set());
  const { toasts, add: addToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const loadAllQrs = useCallback(
    async (silent = false) => {
      if (!silent) setLoadingQrs(true);
      else setRefreshing(true);
      try {
        const res = await fetch(`${BASE_URL}/qr`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: QrItem[] = await res.json();
        setAllQrs(data);
        setFilteredQrs(data);
      } catch {
        addToast("Could not load QR codes — is the backend running?", "error");
      } finally {
        setLoadingQrs(false);
        setRefreshing(false);
      }
    },
    [addToast]
  );

  useEffect(() => { loadAllQrs(); }, [loadAllQrs]);

  useEffect(() => {
    if (!search.trim()) { setFilteredQrs(allQrs); return; }
    setFilteredQrs(allQrs.filter((q) => String(q.tableNumber).includes(search.trim())));
  }, [search, allQrs]);

  const generateQr = async () => {
    const parsed = parseInt(tableNumber, 10);
    if (!tableNumber || isNaN(parsed) || parsed < 1) {
      addToast("Enter a valid table number", "error");
      return;
    }
    const alreadyExists = allQrs.some((q) => q.tableNumber === parsed);
    if (alreadyExists) {
      addToast(`Table ${parsed} already has a QR code`, "error");
      return;
    }
    setGenerating(true);
    setPreviewUrl(null);
    try {
      const res = await fetch(`${BASE_URL}/qr/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber: parsed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      setCurrentBlob(blob);
      setCurrentTableNum(parsed);
      setPreviewUrl(URL.createObjectURL(blob));
      addToast(`QR generated for Table ${parsed}`, "success");
      loadAllQrs(true);
    } catch {
      addToast("Failed to generate QR — check backend", "error");
    } finally {
      setGenerating(false);
    }
  };

  const deleteQr = async (tableNumber: number) => {
    setDeletingTables((prev) => new Set(prev).add(tableNumber));
    try {
      const res = await fetch(`${BASE_URL}/qr/t/${tableNumber}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      addToast(`Table ${tableNumber} QR deleted`, "success");
      // Clear preview if deleted table matches current preview
      if (currentTableNum === tableNumber) {
        setPreviewUrl(null);
        setCurrentBlob(null);
        setCurrentTableNum(null);
      }
      loadAllQrs(true);
    } catch {
      addToast(`Failed to delete Table ${tableNumber}`, "error");
    } finally {
      setDeletingTables((prev) => {
        const next = new Set(prev);
        next.delete(tableNumber);
        return next;
      });
    }
  };

  const downloadCurrent = () => {
    if (!currentBlob || currentTableNum === null) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(currentBlob);
    a.download = `table-${currentTableNum}-qr.png`;
    a.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void generateQr();
  };

  const statMax = allQrs.length > 0 ? Math.max(...allQrs.map((q) => q.tableNumber)) : null;

  const stats: { val: string | number; label: string }[] = [
    { val: loadingQrs ? "—" : allQrs.length, label: "Total Tables" },
    { val: loadingQrs ? "—" : statMax !== null ? `#${statMax}` : "—", label: "Highest Table" },
  ];

  return (
    <>
      <Head>
        <title>TableQR — Management Console</title>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Azeret+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        <style>{`
          body { font-family: 'Azeret Mono', monospace; }

          :root {
            --gold:          #c49a45;
            --gold-bright:   #d4a762;
            --gold-light:    #ffd28c;
            --gold-muted:    #8a6a30;
            --gold-dim:      #5a4020;
            --gold-deep:     #3a2810;
            --off-white:     #f5ead8;
            --off-white-dim: #d0bfa0;
            --bg:            #0d0a07;
            --surface:       #110d08;
            --surface2:      #161008;
            --border:        #1e1408;
            --border-bright: #2a1c0a;
          }

          .gold-border {
            border: 1px solid rgba(196,154,69,0.30) !important;
            box-shadow: 0 0 14px rgba(196,154,69,0.12), inset 0 0 0 1px rgba(196,154,69,0.05);
          }
          .gold-border:focus-within {
            border-color: rgba(196,154,69,0.55) !important;
            box-shadow: 0 0 20px rgba(196,154,69,0.22), inset 0 0 0 1px rgba(196,154,69,0.08);
          }

          @keyframes slide-in  { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
          .animate-slide-in    { animation: slide-in 0.25s ease both; }
          @keyframes card-in   { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
          .animate-card-in     { animation: card-in 0.3s ease both; }
          @keyframes spin-conic { to { transform: rotate(360deg); } }
          .spin-conic          { animation: spin-conic 1.5s linear infinite; }

          input[type=number]::-webkit-inner-spin-button,
          input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
          input[type=number] { -moz-appearance: textfield; }

          input::placeholder { color: var(--gold-dim); opacity: 1; }

          ::-webkit-scrollbar       { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(196,154,69,0.2); border-radius: 2px; }
        `}</style>
      </Head>

      {/* Background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: "var(--bg)",
          backgroundImage:
            "linear-gradient(rgba(196,154,69,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(196,154,69,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="fixed top-0 left-0 w-175 h-125 z-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 0% 0%, rgba(196,154,69,0.10) 0%, transparent 65%)" }}
      />
      <div className="fixed bottom-0 right-0 w-125 h-100 z-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 100% 100%, rgba(212,167,98,0.06) 0%, transparent 65%)" }}
      />

      <div className="relative z-10 min-h-screen text-white pt-32">
        <div className="max-w-6xl mx-auto px-6">

          {/* Header */}
          <header
            className="flex items-center justify-between py-8 border-b"
            style={{ borderColor: "rgba(196,154,69,0.20)" }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg grid place-items-center text-[#1a0f00] text-lg font-black"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  background: "linear-gradient(135deg, #d4a762, #c49a45)",
                  boxShadow: "0 0 20px rgba(196,154,69,0.50), 0 0 6px rgba(196,154,69,0.3)",
                }}
              >
                QR
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: "var(--off-white)" }}>
                  TableQR
                </div>
                <div className="text-[10px] tracking-[2px] uppercase" style={{ color: "var(--gold-muted)" }}>
                  Management Console
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] tracking-wider" style={{ color: "var(--gold-light)" }}>
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "var(--gold-bright)", boxShadow: "0 0 8px var(--gold)" }}
              />
              SYSTEM ONLINE
            </div>
          </header>

          {/* Stats */}
          <div
            className="mt-8 grid grid-cols-2 rounded-2xl overflow-hidden mb-8 gold-border"
            style={{ background: "var(--surface2)" }}
          >
            {stats.map((s, idx) => (
              <div
                key={s.label}
                className="px-6 py-4"
                style={{ borderRight: idx === 0 ? "1px solid rgba(196,154,69,0.18)" : "none" }}
              >
                <div className="text-2xl font-black" style={{ fontFamily: "'Playfair Display', serif", color: "var(--gold-bright)" }}>
                  {s.val}
                </div>
                <div className="text-[10px] tracking-[2px] uppercase mt-0.5" style={{ color: "var(--gold-muted)" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 pb-16">

            {/* Generator Panel */}
            <div
              className="rounded-2xl overflow-hidden flex flex-col gold-border"
              style={{ background: "var(--surface2)" }}
            >
              <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(196,154,69,0.15)" }}>
                <span
                  className="text-[11px] font-semibold tracking-[2.5px] uppercase"
                  style={{ fontFamily: "'Playfair Display', serif", color: "var(--gold-muted)" }}
                >
                  Generate QR
                </span>
              </div>

              <div className="p-6 flex flex-col gap-5 flex-1">
                <div>
                  <label className="block text-[10px] tracking-[2px] uppercase mb-3" style={{ color: "var(--gold-muted)" }}>
                    Table Number
                  </label>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    min={1}
                    max={999}
                    value={tableNumber}
                    placeholder="Enter table number"
                    onChange={(e) => setTableNumber(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full rounded-xl px-4 py-3 text-lg font-semibold outline-none transition-all"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      background: "var(--surface)",
                      border: "1px solid rgba(196,154,69,0.22)",
                      color: "var(--off-white)",
                      boxSizing: "border-box",
                      boxShadow: "0 0 10px rgba(196,154,69,0.06)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(196,154,69,0.65)";
                      e.currentTarget.style.boxShadow = "0 0 18px rgba(196,154,69,0.20)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(196,154,69,0.22)";
                      e.currentTarget.style.boxShadow = "0 0 10px rgba(196,154,69,0.06)";
                    }}
                  />
                </div>

                {/* Preview */}
                <div
                  className="relative aspect-square rounded-2xl flex items-center justify-center overflow-hidden gold-border"
                  style={{ background: "var(--surface)" }}
                >
                  {generating && (
                    <div
                      className="absolute -inset-full w-[300%] h-[300%] spin-conic"
                      style={{ background: "conic-gradient(transparent 30%, rgba(196,154,69,0.10))" }}
                    />
                  )}
                  {previewUrl !== null ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt={`QR Table ${currentTableNum ?? ""}`}
                        className="w-4/5 h-4/5 object-contain rounded-xl"
                        style={{ animation: "card-in 0.4s ease" }}
                      />
                      <span className="absolute bottom-3 text-[10px] tracking-[2px] uppercase" style={{ color: "var(--gold-muted)" }}>
                        TABLE {currentTableNum}
                      </span>
                    </>
                  ) : (
                    <QrPlaceholder />
                  )}
                </div>

                {/* Generate button */}
                <button
                  onClick={() => void generateQr()}
                  disabled={generating}
                  className="w-full py-4 font-bold text-sm tracking-wider rounded-xl transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    background: generating ? "var(--border)" : "linear-gradient(135deg, #d4a762, #c49a45)",
                    color: generating ? "var(--gold-dim)" : "#1a0f00",
                    boxShadow: generating ? "none" : "0 4px 24px rgba(196,154,69,0.35), 0 0 10px rgba(196,154,69,0.15)",
                  }}
                >
                  {generating ? "GENERATING..." : "GENERATE QR CODE"}
                </button>

                {/* Download */}
                <button
                  onClick={downloadCurrent}
                  disabled={previewUrl === null}
                  className="w-full py-3 text-xs tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    border: "1px solid rgba(196,154,69,0.22)",
                    color: "var(--gold-muted)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (previewUrl !== null) {
                      e.currentTarget.style.borderColor = "rgba(196,154,69,0.65)";
                      e.currentTarget.style.color = "var(--gold-light)";
                      e.currentTarget.style.boxShadow = "0 0 14px rgba(196,154,69,0.18)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(196,154,69,0.22)";
                    e.currentTarget.style.color = "var(--gold-muted)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  DOWNLOAD PNG
                </button>
              </div>
            </div>

            {/* All QRs Panel */}
            <div
              className="rounded-2xl overflow-hidden flex flex-col gold-border"
              style={{ background: "var(--surface2)" }}
            >
              <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(196,154,69,0.15)" }}>
                <span
                  className="text-[11px] font-semibold tracking-[2.5px] uppercase"
                  style={{ fontFamily: "'Playfair Display', serif", color: "var(--gold-muted)" }}
                >
                  All Tables
                </span>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-3 px-6 py-3 border-b" style={{ borderColor: "rgba(196,154,69,0.15)" }}>
                <input
                  type="text"
                  placeholder="Filter by table number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 rounded-lg px-4 py-2 text-xs outline-none transition-all font-mono"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid rgba(196,154,69,0.22)",
                    color: "var(--gold-light)",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(196,154,69,0.60)";
                    e.currentTarget.style.boxShadow = "0 0 12px rgba(196,154,69,0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(196,154,69,0.22)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  onClick={() => void loadAllQrs(true)}
                  className="flex items-center gap-2 px-4 py-2 text-[11px] tracking-wider rounded-lg transition-all whitespace-nowrap"
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${refreshing ? "rgba(196,154,69,0.60)" : "rgba(196,154,69,0.22)"}`,
                    color: refreshing ? "var(--gold-bright)" : "var(--gold-muted)",
                    boxShadow: refreshing ? "0 0 12px rgba(196,154,69,0.18)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(196,154,69,0.60)";
                    e.currentTarget.style.color = "var(--gold-bright)";
                    e.currentTarget.style.boxShadow = "0 0 12px rgba(196,154,69,0.18)";
                  }}
                  onMouseLeave={(e) => {
                    if (!refreshing) {
                      e.currentTarget.style.borderColor = "rgba(196,154,69,0.22)";
                      e.currentTarget.style.color = "var(--gold-muted)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    className={refreshing ? "animate-spin" : ""}
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  REFRESH
                </button>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-6 max-h-140">
                {loadingQrs ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                ) : filteredQrs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 py-16 text-xs tracking-widest text-center" style={{ color: "var(--gold-dim)" }}>
                    <span className="text-2xl opacity-40">⬜</span>
                    {allQrs.length === 0 ? (
                      <>
                        NO QR CODES FOUND
                        <span className="text-[10px] mt-1 block">Generate one to get started</span>
                      </>
                    ) : "NO RESULTS MATCH FILTER"}
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
                    {filteredQrs.map((qr, i) => (
                      <QrCard
                        key={qr.tableNumber}
                        qr={qr}
                        index={i}
                        onSelect={(n: number) => {
                          setTableNumber(String(n));
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        onDelete={deleteQr}
                        deleting={deletingTables.has(qr.tableNumber)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <ToastStack toasts={toasts} />
    </>
  );
};

export default QrDashboard;