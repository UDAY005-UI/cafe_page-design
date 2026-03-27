"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "../../public/logo.png";

export default function AdminNavbar() {
  const links = [
    { label: "Orders", href: "/admin/orders" },
    { label: "Menu", href: "/admin/menu" },
    { label: "Qrs", href: "/admin/qr" },
  ];

  return (
    <nav
      className="
        fixed top-6 z-50 lg:left-8
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
        <span>Caffiq</span>
      </div>

      {/* Links — EXACT SAME STYLE */}
      <div className="flex gap-10 text-sm text-white">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:text-gray-300 transition"
          >
            {link.label}
          </Link>
        ))}
      </div>

    </nav>
  );
}