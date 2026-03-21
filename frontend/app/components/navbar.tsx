"use client";

import { useEffect, useState } from "react";
import logo from "../../public/logo.png";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`
        fixed top-6 left-1/2 -translate-x-1/2 z-50
        w-[90%] max-w-7xl
        flex items-center justify-between
        px-10 py-4
        rounded-4xl
        transition-all duration-300

        ${
          scrolled
  ? "bg-black/60 backdrop-blur-md border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
  : "bg-transparent border border-white/0"
        }
      `}
    >

      <div className="flex items-center gap-2 text-white font-serif text-xl tracking-wide">
        <Image src={logo} alt="logo" className="size-9" />
        <h1>Caffiq</h1>
      </div>

      <div className="flex gap-10 text-sm text-white">

        <button
          onClick={() => scrollToSection("home")}
          className="hover:text-gray-300 transition"
        >
          Home
        </button>

        <button
          onClick={() => scrollToSection("about")}
          className="hover:text-gray-300 transition"
        >
          About
        </button>

        <button
          onClick={() => scrollToSection("discover")}
          className="hover:text-gray-300 transition"
        >
          Discover
        </button>

        <button
          onClick={() => scrollToSection("location")}
          className="hover:text-gray-300 transition"
        >
          Location
        </button>

      </div>

      <Link
        href="/menu"
        className="
          px-5 py-2 rounded-full
          bg-[#c49a45] text-black text-sm font-medium
          hover:bg-[#d6aa5a]
          transition-all duration-300
        "
      >
        Menu ↗
      </Link>

    </nav>
  );
}