import Link from "next/link";
import Image from "next/image";
import logo from "../../public/logo.png";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10">

      <div className="px-6 sm:px-12 lg:px-24 xl:px-30 py-10 lg:py-14 grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-20">

        {/* Brand — full width only on mobile */}
        <div className="flex flex-col gap-4 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-white font-serif text-xl">
            <Image src={logo} alt="logo" className="size-9" />
            <span>Caffiq</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Crafted for slow mornings, meaningful conversations, and moments
            that linger beyond the last sip.
          </p>
        </div>

        {/* Explore */}
        <div className="flex flex-col gap-2 text-sm text-gray-400">
          <p className="text-white mb-2 font-medium">Explore</p>
          <button className="hover:text-white transition text-left">Home</button>
          <button className="hover:text-white transition text-left">About</button>
          <button className="hover:text-white transition text-left">Discover</button>
          <button className="hover:text-white transition text-left">Location</button>
        </div>

        {/* Visit */}
        <div className="flex flex-col gap-2 text-sm text-gray-400">
          <p className="text-white mb-2 font-medium">Visit</p>
          <p>21 Park Street, Kolkata<br />West Bengal 700016</p>
          <p className="mt-1">Mon – Sun<br />8:00 AM – 9:00 PM</p>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-2 text-sm text-gray-400">
          <p className="text-white mb-2 font-medium">Contact</p>
          <div>
            <p className="text-white text-sm">Phone</p>
            <a href="tel:+919876543210" className="hover:text-white transition">+91 98765 43210</a>
          </div>
          <div>
            <p className="text-white text-sm">Email</p>
            <a href="mailto:hello@caffiq.com" className="hover:text-white transition">hello@caffiq.com</a>
          </div>
          <div>
            <p className="text-white text-sm">Support</p>
            <p>support@caffiq.com</p>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="
        px-6 sm:px-12 lg:px-24 xl:px-30 py-5
        border-t border-white/5
        text-gray-500 text-sm
        flex flex-col sm:flex-row items-center justify-between gap-3
      ">
        <p>© 2026 Caffiq. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-white transition">Instagram</Link>
          <Link href="#" className="hover:text-white transition">Twitter</Link>
          <Link href="#" className="hover:text-white transition">LinkedIn</Link>
        </div>
      </div>

    </footer>
  );
}