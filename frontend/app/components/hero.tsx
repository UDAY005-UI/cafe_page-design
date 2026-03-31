"use client";
import Image from "next/image";
import coffee from "../../public/coffee4.png";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const img = imageRef.current;
    if (!section || !img) return;

    const onMove = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;
      const { width, height, left, top } = target.getBoundingClientRect();
      const dx = (e.clientX - left - width / 2) / width;
      const dy = (e.clientY - top - height / 2) / height;
      img.style.transform = `translate(${dx * -18}px, ${dy * -12}px) scale(1.03)`;
    };
    const onLeave = () => {
      img.style.transform = "translate(0,0) scale(1)";
    };

    section.addEventListener("mousemove", onMove);
    section.addEventListener("mouseleave", onLeave);
    return () => {
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(38px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(70px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0)   scale(1); }
        }
        @keyframes floatY {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-18px); }
        }
        @keyframes orbPulse {
          0%,100% { opacity: .55; transform: scale(1); }
          50%      { opacity: .85; transform: scale(1.12); }
        }
        @keyframes shimmerBtn {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes steamRise {
          0%   { opacity: 0;   transform: translateY(0)   scaleX(1);   }
          30%  { opacity: .55;                                          }
          70%  { opacity: .3;  transform: translateY(-60px) scaleX(1.4);}
          100% { opacity: 0;   transform: translateY(-90px) scaleX(1.7);}
        }
        @keyframes lineSweep {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes badgeIn {
          from { opacity:0; transform: translateY(14px) scale(.92); }
          to   { opacity:1; transform: translateY(0)    scale(1);   }
        }
        @keyframes glowBreath {
          0%,100% { opacity:.38; }
          50%      { opacity:.62; }
        }

        .hero-label  { animation: fadeUp  .7s cubic-bezier(.22,1,.36,1) both; animation-delay: .15s; }
        .hero-h1     { animation: fadeUp  .9s cubic-bezier(.22,1,.36,1) both; animation-delay: .32s; }
        .hero-line   { animation: lineSweep .8s cubic-bezier(.22,1,.36,1) both; animation-delay: .7s; transform-origin: left; }
        .hero-body   { animation: fadeUp  .8s cubic-bezier(.22,1,.36,1) both; animation-delay: .55s; }
        .hero-btn    { animation: fadeUp  .8s cubic-bezier(.22,1,.36,1) both; animation-delay: .75s; }
        .hero-img    { animation: slideRight 1.1s cubic-bezier(.22,1,.36,1) both; animation-delay: .4s; }
        .hero-badge  { animation: badgeIn .7s cubic-bezier(.22,1,.36,1) both; }

        .float-img   { animation: floatY 6s ease-in-out infinite; transition: transform .55s cubic-bezier(.22,1,.36,1); }
        .orb-pulse   { animation: orbPulse 4s ease-in-out infinite; }
        .glow-breath { animation: glowBreath 3.5s ease-in-out infinite; }

        .btn-shimmer {
          background: linear-gradient(110deg,#c49a45 35%,#ffd28c 50%,#c49a45 65%);
          background-size: 200% auto;
          transition: background-position .4s, box-shadow .3s, transform .25s;
        }
        .btn-shimmer:hover {
          animation: shimmerBtn .9s linear;
          box-shadow: 0 0 28px rgba(196,154,69,.55), 0 6px 20px rgba(0,0,0,.4);
          transform: translateY(-2px) scale(1.03);
        }
        .btn-shimmer:active { transform: scale(.97); }

        .steam-wrap { position:absolute; display:flex; gap:10px; pointer-events:none; }
        .steam {
          width: 6px; height: 30px;
          background: linear-gradient(to top, rgba(255,210,140,.35), transparent);
          border-radius: 99px;
          animation: steamRise 2.4s ease-in-out infinite;
        }
        .steam:nth-child(2) { animation-delay:.6s; height:22px; }
        .steam:nth-child(3) { animation-delay:1.2s; height:26px; }

        .pre-anim { opacity: 0; }
        .anim-ready .pre-anim { opacity: unset; }
      `}</style>

      <section
        id="home"
        ref={sectionRef}
        className={`relative overflow-hidden w-full min-h-screen bg-black ${mounted ? "anim-ready" : ""}`}
      >
        {/* ── Ambient orbs ──
            Shifted down (~navbar height) so they sit behind the content
            and blend naturally — no black gap at the top. */}
        <div
          className="absolute right-[10%] w-120 h-120 rounded-full pointer-events-none orb-pulse"
          style={{
            top: "8%",          // was -10% — now starts below navbar
            background: "radial-gradient(circle, rgba(196,154,69,.28) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-[-5%] right-[30%] w-[320px] h-80 rounded-full pointer-events-none glow-breath"
          style={{
            background: "radial-gradient(circle, rgba(255,145,65,.22) 0%, transparent 70%)",
            filter: "blur(50px)",
            animationDelay: "1.2s",
          }}
        />
        <div
          className="absolute left-[5%] w-50 h-50 rounded-full pointer-events-none glow-breath"
          style={{
            top: "46%",
            background: "radial-gradient(circle, rgba(255,175,85,.12) 0%, transparent 70%)",
            filter: "blur(40px)",
            animationDelay: "2s",
          }}
        />

        {/* Noise grain */}
        <div
          className="absolute inset-0 pointer-events-none z-1"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
            backgroundSize: "180px",
            opacity: 0.6,
          }}
        />

        {/* ══ DESKTOP (lg+) ══ */}
        <div className="hidden lg:flex relative z-10 w-full h-screen items-center pt-16">
          {/*
            pt-16 (64px) = standard navbar height.
            This shifts the content block down uniformly so it doesn't
            sit under the navbar, WITHOUT adding a black gap — because
            the orbs above are already positioned to cover this area.
          */}

          {/* Left: Text */}
          <div className="flex flex-col gap-5 pl-20 xl:pl-32 max-w-[52%]">
            <div className={`pre-anim hero-label flex items-center gap-3`}>
              <span className="block w-8 h-0.5 rounded-full bg-[#ffd28c]" />
              <p className="text-[#ffd28c] tracking-[.2em] text-sm uppercase font-medium">
                Artisan Coffee Experience
              </p>
            </div>

            <h1
              className={`pre-anim hero-h1 text-white leading-[1.02] font-serif`}
              style={{ fontSize: "clamp(3.5rem, 7vw, 6.5rem)" }}
            >
              Indulge <br />
              <span style={{ color: "#ffd28c" }}>in Every</span> Sip
            </h1>

            <div className={`pre-anim hero-line h-0.5 w-24 rounded-full bg-linear-to-r from-[#c49a45] to-transparent`} />

            <p className={`pre-anim hero-body text-gray-400 max-w-lg leading-relaxed text-base xl:text-lg`}>
              From bean selection to the final pour, we craft each cup with precision, passion, and
              a touch of elegance. Every step is thoughtfully curated—sourcing the finest beans,
              roasting to perfection, and brewing with care—to deliver a rich and unforgettable
              coffee experience.
            </p>

            <div className={`pre-anim hero-btn flex items-center gap-5 mt-2`}>
              <button className="btn-shimmer px-7 py-3.5 rounded-full text-black font-semibold text-sm tracking-wide">
                Sip the Experience →
              </button>
              <button className="text-gray-400 text-sm hover:text-[#ffd28c] transition-colors duration-300 underline underline-offset-4 decoration-[#ffd28c]/30 hover:decoration-[#ffd28c]">
                View Our Menu
              </button>
            </div>

            <div className={`pre-anim hero-badge flex gap-8 mt-4`} style={{ animationDelay: ".9s" }}>
              {[["12+", "Origin Countries"], ["4.9★", "Guest Rating"], ["100%", "Arabica Beans"]].map(([num, label]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[#ffd28c] font-serif text-xl font-bold">{num}</span>
                  <span className="text-gray-500 text-xs tracking-wide">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Image */}
          <div
            className={`pre-anim hero-img absolute right-0 bottom-0 h-full flex items-end justify-end px-16 xl:px-24`}
            style={{
              background: `
                radial-gradient(ellipse 28% 45% at 58% 15%, rgba(255,175,85,.32) 0%, transparent 100%),
                radial-gradient(ellipse 35% 50% at 61% 52%, rgba(255,145,65,.34) 0%, transparent 100%),
                radial-gradient(ellipse 20% 30% at 59% 70%, rgba(255,125,50,.24) 0%, transparent 100%),
                linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,.25) 65%, rgba(0,0,0,1) 95%),
                linear-gradient(to right, #000 0%, #000 42%, transparent 100%)
              `,
            }}
          >
            <div className="relative">
              <div className="steam-wrap" style={{ top: "-55px", left: "38%" }}>
                <div className="steam" />
                <div className="steam" />
                <div className="steam" />
              </div>
              <div ref={imageRef} className="float-img">
                <Image
                  src={coffee}
                  alt="Artisan coffee cup"
                  className="h-[78vh] w-auto object-contain drop-shadow-2xl"
                  style={{ filter: "drop-shadow(0 30px 60px rgba(196,154,69,.35))" }}
                  priority
                />
              </div>
              <div
                className="hero-badge absolute top-[18%] -left-16 bg-black/70 backdrop-blur-md border border-[#c49a45]/30 rounded-2xl px-4 py-3 flex flex-col gap-1"
                style={{ animationDelay: "1.1s" }}
              >
                <span className="text-[#ffd28c] text-xs tracking-widest uppercase">Today&apos;s Special</span>
                <span className="text-white font-serif text-base">Ethiopian Yirgacheffe</span>
                <span className="text-gray-400 text-xs">Light roast · Floral notes</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ MOBILE / TABLET (below lg) ══ */}
        <div className="flex lg:hidden flex-col relative z-10 w-full min-h-screen pt-28 pb-8 px-6 sm:px-10">

          {/* 1. Label */}
          <div className={`pre-anim hero-label flex items-center gap-3 mb-3`}>
            <span className="block w-6 h-0.5 rounded-full bg-[#ffd28c]" />
            <p className="text-[#ffd28c] tracking-[.18em] text-xs uppercase font-medium">
              Artisan Coffee Experience
            </p>
          </div>

          {/* 2. Heading */}
          <h1
            className={`pre-anim hero-h1 text-white font-serif leading-[1.05]`}
            style={{ fontSize: "clamp(2.6rem, 10vw, 4rem)" }}
          >
            Indulge <br />
            <span style={{ color: "#ffd28c" }}>in Every</span> Sip
          </h1>

          {/* 3. Gold divider */}
          <div className={`pre-anim hero-line h-0.5 w-16 rounded-full bg-linear-to-r from-[#c49a45] to-transparent mt-4`} />

          {/* 4. Body */}
          <p className={`pre-anim hero-body text-gray-400 leading-relaxed text-sm sm:text-base max-w-md mt-5`}>
            From bean selection to the final pour, we craft each cup with precision, passion, and
            a touch of elegance. Every step is thoughtfully curated—sourcing the finest beans,
            roasting to perfection, and brewing with care—to deliver a rich and unforgettable
            coffee experience.
          </p>

          {/* 5. Stats */}
          <div
            className={`pre-anim hero-badge flex gap-6 mt-6 pt-5 border-t border-white/10`}
            style={{ animationDelay: ".9s" }}
          >
            {[["12+", "Origins"], ["4.9★", "Rating"], ["100%", "Arabica"]].map(([num, label]) => (
              <div key={label} className="flex flex-col">
                <span className="text-[#ffd28c] font-serif text-lg font-bold">{num}</span>
                <span className="text-gray-500 text-xs">{label}</span>
              </div>
            ))}
          </div>

          {/* 6. Cup image */}
          <div
            className="relative flex justify-center items-end mt-8"
            style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem", width: "calc(100% + 3rem)" }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 80% 60% at 50% 80%, rgba(255,145,65,.4) 0%, rgba(196,154,69,.2) 45%, transparent 75%)",
                filter: "blur(32px)",
              }}
            />
            <div className="steam-wrap" style={{ bottom: "72%", left: "50%", transform: "translateX(-40%)" }}>
              <div className="steam" />
              <div className="steam" style={{ animationDelay: ".7s" }} />
              <div className="steam" style={{ animationDelay: "1.3s" }} />
            </div>
            <div className={`pre-anim hero-img relative`}>
              <Image
                src={coffee}
                alt="Artisan coffee cup"
                className="w-full max-w-sm h-auto object-contain"
                style={{ filter: "drop-shadow(0 20px 50px rgba(196,154,69,.55))" }}
                priority
              />
            </div>
          </div>

          {/* 7. CTA — below the cup */}
          <div className={` relative pre-anim hero-btn flex flex-wrap items-center z-90 justify-center gap-4 mt-20`}>
            <Link href={"/menu"} className="btn-shimmer px-6 py-3 rounded-full text-black font-semibold text-sm tracking-wide">
              Sip the Experience →
            </Link>
            <Link
              href={"/menu"}
              className="text-gray-400 text-sm hover:text-[#ffd28c] transition-colors underline underline-offset-4 decoration-[#ffd28c]/30"
            >
              View Our Menu
            </Link>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="lg:block hidden absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-black to-transparent z-20 pointer-events-none" />
      </section>
    </>
  );
}