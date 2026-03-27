"use client";

import Image from "next/image";
import logo from "../../public/logo.png";
import Link from "next/link";

export default function UserTopbar() {
  return (
    <div className="fixed top-6 z-50 w-full flex justify-center">
      <nav
        className="
          w-[95%] max-w-screen-xl
          flex items-center justify-between
          px-6 sm:px-10 py-4
          rounded-4xl
          bg-black/60 backdrop-blur-md
          border border-white/10
          shadow-[0_10px_40px_rgba(0,0,0,0.4)]
        "
      >
        <div className="flex items-center gap-2 text-white font-serif text-xl tracking-wide">
          <Image src={logo} alt="logo" className="size-9" />
          <Link href="/">Caffiq</Link>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/menu"
            className="
              relative group
              text-xs tracking-[0.2em] uppercase
              text-[#d4a762]/70
              transition-all duration-300
              hover:text-[#f1c87a]
            "
          >
            <span className="relative z-10">Menu</span>
            <span
              className="
                absolute inset-0 rounded-md
                opacity-0 blur-md
                bg-[#d4a762]/60
                transition-opacity duration-300
                group-hover:opacity-100
              "
            />
          </Link>
        </div>
      </nav>
    </div>
  );
}