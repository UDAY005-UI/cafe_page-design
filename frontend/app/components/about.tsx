"use client";

import Image from "next/image";
import coffee from "../../public/coffee.jpg";
import crossiant from "../../public/crossiant.jpg";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/* ─── Tiny hook: triggers CSS class when element enters viewport ─── */
function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return ref;
}

export default function About() {
  const router = useRouter();

  const titleRef = useReveal<HTMLDivElement>(0.2);
  const row1TextRef = useReveal<HTMLDivElement>(0.2);
  const row1ImgRef = useReveal<HTMLDivElement>(0.2);
  const row2ImgRef = useReveal<HTMLDivElement>(0.2);
  const row2TextRef = useReveal<HTMLDivElement>(0.2);

  return (
    <>
      <style>{`
        /* ── Keyframes ───────────────────────────────────────────── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(48px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fadeLeft {
          from { opacity: 0; transform: translateX(-56px); }
          to   { opacity: 1; transform: translateX(0);     }
        }
        @keyframes fadeRight {
          from { opacity: 0; transform: translateX(56px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1);    }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-8px); }
        }
        @keyframes lineDraw {
          from { width: 0;    }
          to   { width: 3rem; }
        }

        /* ── Reveal base state (hidden) ──────────────────────────── */
        .reveal-up,
        .reveal-left,
        .reveal-right,
        .reveal-scale {
          opacity: 0;
        }
        .reveal-child > * {
          opacity: 0;
        }

        /* ── Triggered state ─────────────────────────────────────── */
        .is-visible.reveal-up,
        .is-visible .reveal-up {
          animation: fadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards;
        }
        .is-visible.reveal-left {
          animation: fadeLeft 0.85s cubic-bezier(.22,1,.36,1) forwards;
        }
        .is-visible.reveal-right {
          animation: fadeRight 0.85s cubic-bezier(.22,1,.36,1) forwards;
        }
        .is-visible.reveal-scale {
          animation: scaleIn 0.9s cubic-bezier(.22,1,.36,1) forwards;
        }

        /* ── Stagger helpers ─────────────────────────────────────── */
        .is-visible .d1 { animation: fadeUp 0.7s .05s cubic-bezier(.22,1,.36,1) forwards; }
        .is-visible .d2 { animation: fadeUp 0.7s .18s cubic-bezier(.22,1,.36,1) forwards; }
        .is-visible .d3 { animation: fadeUp 0.7s .32s cubic-bezier(.22,1,.36,1) forwards; }
        .is-visible .d4 { animation: fadeUp 0.7s .46s cubic-bezier(.22,1,.36,1) forwards; }
        .is-visible .d5 { animation: fadeUp 0.7s .60s cubic-bezier(.22,1,.36,1) forwards; }

        /* ── Accent line draw ────────────────────────────────────── */
        .line-accent {
          display: inline-block;
          width: 0;
          height: 2px;
          background: #ffd28c;
          transition: width 0.4s ease;
        }
        .is-visible .line-accent {
          animation: lineDraw 0.6s 0.7s ease forwards;
        }

        /* ── Shimmer title ───────────────────────────────────────── */
        .shimmer-title {
          background: linear-gradient(
            90deg,
            #ffffff 30%,
            #ffd28c 50%,
            #ffffff 70%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .is-visible .shimmer-title {
          animation: fadeUp 0.9s cubic-bezier(.22,1,.36,1) forwards,
                     shimmer 3s 1s linear infinite;
        }

        /* ── Image hover ─────────────────────────────────────────── */
        .img-wrap {
          overflow: hidden;
          border-radius: 1.5rem;
          position: relative;
        }
        .img-wrap img {
          transition: transform 0.7s cubic-bezier(.22,1,.36,1),
                      filter  0.7s ease;
        }
        .img-wrap:hover img {
          transform: scale(1.06);
          filter: brightness(1.08) saturate(1.1);
        }
        .img-wrap::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(196,154,69,.18) 0%, transparent 60%);
          border-radius: 1.5rem;
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
        }
        .img-wrap:hover::after { opacity: 1; }

        /* ── Float badge ─────────────────────────────────────────── */
        .float-badge {
          animation: float 4s ease-in-out infinite;
        }

        /* ── Button ──────────────────────────────────────────────── */
        .cta-btn {
          position: relative;
          overflow: hidden;
          background: #c49a45;
          color: #1a1008;
          border: none;
          border-radius: 9999px;
          padding: 0.75rem 1.75rem;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          letter-spacing: 0.02em;
          min-width: 11rem;
        }
        .cta-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,.35) 50%, transparent 70%);
          transform: translateX(-120%);
          transition: transform 0.55s ease;
        }
        .cta-btn:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 12px 32px rgba(196,154,69,.45);
        }
        .cta-btn:hover::before { transform: translateX(120%); }
        .cta-btn:active { transform: translateY(0) scale(.98); }

        /* ── Decorative glow orbs ────────────────────────────────── */
        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
      `}</style>

      <section
        id="about"
        className="relative w-full h-auto px-6 sm:px-12 lg:px-24 xl:px-32 py-20 overflow-hidden"
      >
        {/* ── Ambient glow orbs ── */}
        <div
          className="glow-orb"
          style={{
            width: "420px", height: "420px",
            background: "rgba(196,154,69,.12)",
            top: "-60px", right: "-80px",
          }}
        />
        <div
          className="glow-orb"
          style={{
            width: "320px", height: "320px",
            background: "rgba(255,210,140,.07)",
            bottom: "100px", left: "-60px",
          }}
        />

        {/* ── Section Title ── */}
        <div
          ref={titleRef}
          className="reveal-child flex flex-col items-center justify-center gap-3 pb-16 relative z-10"
        >
          <span className="d1 line-accent" />
          <h2 className="d2 shimmer-title text-4xl sm:text-5xl lg:text-6xl font-semibold text-center tracking-tight font-serif">
            About Our Cafe
          </h2>
          <p className="d3 text-gray-400 text-sm tracking-widest uppercase">
            Where every detail matters
          </p>
          <span className="d4 line-accent" />
        </div>

        {/* ── Content Rows ── */}
        <div className="flex flex-col gap-24 lg:gap-32 relative z-10">

          {/* ── Row 1: Text Left · Image Right ── */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">

            {/* Text */}
            <div
              ref={row1TextRef}
              className="reveal-child flex flex-col items-start justify-center gap-5 w-full lg:w-1/2"
            >
              <p className="d1 text-[#ffd28c] text-sm font-semibold uppercase tracking-widest">
                Refined Origins
              </p>
              <h1 className="d2 text-white text-3xl sm:text-4xl font-bold font-serif leading-snug">
                A Story in<br />Every Pour
              </h1>
              <div className="d3 w-10 h-0.5 bg-[#c49a45] rounded-full" />
              <p className="d4 text-gray-300 leading-relaxed max-w-md text-base">
                Each cup begins long before it reaches your table. From carefully
                nurtured farms to precise roasting, we shape every detail to create
                a coffee experience that feels intentional, balanced, and quietly
                indulgent.
              </p>
              <div className="d5">
                <button onClick={() => router.push("/menu")} className="cta-btn">Step Inside →</button>
              </div>
            </div>

            {/* Image */}
            <div
              ref={row1ImgRef}
              className="reveal-scale w-full lg:w-1/2 relative"
            >
              <div className="img-wrap w-full shadow-2xl shadow-black/50">
                <Image
                  src={coffee}
                  alt="coffee"
                  className="w-full h-64 sm:h-80 lg:h-105 object-cover"
                />
              </div>
              {/* Floating badge */}
              <div
                className="float-badge absolute -bottom-5 -left-5 bg-[#1a1008] border border-[#c49a45]/40 rounded-2xl px-5 py-3 shadow-xl hidden sm:flex items-center gap-3"
              >
                <span className="text-2xl">☕</span>
                <div>
                  <p className="text-[#ffd28c] text-xs font-semibold uppercase tracking-wider">Single Origin</p>
                  <p className="text-white text-sm font-medium">Ethiopia · Yirgacheffe</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 2: Image Left · Text Right ── */}
          <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-12 lg:gap-16">

            {/* Image */}
            <div
              ref={row2ImgRef}
              className="reveal-scale w-full lg:w-1/2 relative"
            >
              <div className="img-wrap w-full shadow-2xl shadow-black/50">
                <Image
                  src={crossiant}
                  alt="croissant"
                  className="w-full h-64 sm:h-80 lg:h-105 object-cover"
                />
              </div>
              {/* Floating badge */}
              <div
                className="float-badge absolute -bottom-5 -right-5 bg-[#1a1008] border border-[#c49a45]/40 rounded-2xl px-5 py-3 shadow-xl hidden sm:flex items-center gap-3"
                style={{ animationDelay: "1.5s" }}
              >
                <span className="text-2xl">🥐</span>
                <div>
                  <p className="text-[#ffd28c] text-xs font-semibold uppercase tracking-wider">Baked Fresh</p>
                  <p className="text-white text-sm font-medium">Daily at 6 AM</p>
                </div>
              </div>
            </div>

            {/* Text */}
            <div
              ref={row2TextRef}
              className="reveal-child flex flex-col items-start justify-center gap-5 w-full lg:w-1/2"
            >
              <p className="d1 text-[#ffd28c] text-sm font-semibold uppercase tracking-widest">
                Beyond Brewing
              </p>
              <h1 className="d2 text-white text-3xl sm:text-4xl font-bold font-serif leading-snug">
                An Elevated<br />Experience
              </h1>
              <div className="d3 w-10 h-0.5 bg-[#c49a45] rounded-full" />
              <p className="d4 text-gray-300 leading-relaxed max-w-md text-base">
                This is not just coffee — it&apos;s a composition of flavor, texture,
                and aroma. Designed to slow you down and draw you in, one sip at
                a time.
              </p>
              <div className="d5">
                <button onClick={() => router.push("/menu")} className="cta-btn">Explore Further →</button>
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}