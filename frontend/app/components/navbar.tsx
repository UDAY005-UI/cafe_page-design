"use client";

import { useEffect, useState, useRef } from "react";
import logo from "../../public/logo.png";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { label: "Home", id: "home" },
    { label: "About", id: "about" },
    { label: "Discover", id: "discover" },
    { label: "Location", id: "location" },
  ];

  return (
    <nav
      className={`
        fixed top-6 z-50 lg:left-8
        w-[95%] max-w-screen
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
      {/* Logo */}
      <div className="flex items-center gap-2 text-white font-serif text-xl tracking-wide">
        <Image src={logo} alt="logo" className="size-9" />
        <h1>Caffiq</h1>
      </div>

      {/* Desktop nav links — hidden on small screens */}
      <div className="hidden md:flex gap-10 text-sm text-white">
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => scrollToSection(link.id)}
            className="hover:text-gray-300 transition"
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Desktop Menu CTA — hidden on small screens */}
      <Link
        href="/menu"
        className="
          hidden md:inline-flex
          px-5 py-2 rounded-full
          bg-[#c49a45] text-black text-sm font-medium
          hover:bg-[#d6aa5a]
          transition-all duration-300
        "
      >
        Menu ↗
      </Link>

      {/* Mobile: hamburger — visible only on small screens */}
      <div className="relative md:hidden" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex flex-col justify-center items-center gap-1.25 w-9 h-9"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 bg-white rounded-full transition-all duration-300 origin-center
              ${menuOpen ? "w-5 rotate-45 translate-y-1.75" : "w-6"}`}
          />
          <span
            className={`block h-0.5 bg-white rounded-full transition-all duration-300
              ${menuOpen ? "opacity-0 w-0" : "w-5"}`}
          />
          <span
            className={`block h-0.5 bg-white rounded-full transition-all duration-300 origin-center
              ${menuOpen ? "w-5 -rotate-45 -translate-y-1.75" : "w-6"}`}
          />
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div
            className="
              absolute right-0 top-12
              w-44
              bg-black/80 backdrop-blur-md
              border border-white/10
              rounded-2xl
              shadow-[0_10px_40px_rgba(0,0,0,0.5)]
              overflow-hidden
              flex flex-col
            "
          >
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="
                  text-left text-sm text-white
                  px-5 py-3
                  hover:bg-white/10
                  transition-colors duration-200
                "
              >
                {link.label}
              </button>
            ))}

            {/* Menu CTA inside dropdown on mobile */}
            <Link
              href="/menu"
              className="
                mx-3 mb-3 mt-1
                px-5 py-2 rounded-full
                bg-[#c49a45] text-black text-sm font-medium text-center
                hover:bg-[#d6aa5a]
                transition-all duration-300
              "
            >
              Menu ↗
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}