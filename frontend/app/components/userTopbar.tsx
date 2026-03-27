"use client";

import Image from "next/image";
import logo from "../../public/logo.png";
import Link from "next/link";

export default function UserTopbar({ cartCount }: { cartCount?: number }) {
  return (
    <div className="fixed top-6 z-50 w-full flex justify-center">
      <nav
        className="
          w-[95%] max-w-screen
          flex items-center justify-between
          px-10 py-4
          rounded-4xl
          bg-black/60 backdrop-blur-md
          border border-white/10
          shadow-[0_10px_40px_rgba(0,0,0,0.4)]
        "
      >
        {/* Logo */}
        <div className="flex items-center gap-2 text-white font-serif text-xl tracking-wide">
          <Image src={logo} alt="logo" className="size-9" />
          <Link href={"/"}>Caffiq</Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-10">

          {/* Session label (same visual weight as nav links) */}
          <span className="hidden md:block text-sm text-white/70 hover:text-gray-300 transition">
            Table Session
          </span>

          {/* Cart CTA */}
          <button
            className="
              relative
              px-5 py-2 rounded-full
              bg-[#c49a45] text-black text-sm font-medium
              hover:bg-[#d6aa5a]
              transition-all duration-300
            "
          >
            Cart
            {cartCount && cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 text-xs rounded-full bg-black text-[#c49a45] border border-[#c49a45] grid place-items-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}