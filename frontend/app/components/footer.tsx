import Link from "next/link";
import Image from "next/image";
import logo from "../../public/logo.png";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10">

      <div className="px-30 py-16 flex justify-between gap-20">

        <div className="flex flex-col gap-4 max-w-sm">

          <div className="flex items-center gap-2 text-white font-serif text-xl">
            <Image src={logo} alt="logo" className="size-9" />
            <span>Caffiq</span>
          </div>

          <p className="text-gray-400 text-sm leading-relaxed">
            Crafted for slow mornings, meaningful conversations, and moments
            that linger beyond the last sip.
          </p>

        </div>

        <div className="flex flex-col gap-3 text-sm text-gray-400 min-w-30">

          <p className="text-white mb-2">Explore</p>

          <button className="hover:text-white transition text-left">Home</button>
          <button className="hover:text-white transition text-left">About</button>
          <button className="hover:text-white transition text-left">Discover</button>
          <button className="hover:text-white transition text-left">Location</button>

        </div>

        <div className="flex flex-col gap-3 text-sm text-gray-400 min-w-40">

          <p className="text-white mb-2">Visit</p>

          <p>
            21 Park Street, Kolkata<br />
            West Bengal 700016
          </p>

          <p>
            Mon – Sun<br />
            8:00 AM – 9:00 PM
          </p>

        </div>

        <div className="flex flex-col gap-3 text-sm text-gray-400 min-w-[160px]">

          <p className="text-white mb-2">Contact</p>

          <div>
            <p className="text-white text-sm">Phone</p>
            <a href="tel:+919876543210" className="hover:text-white transition">
              +91 98765 43210
            </a>
          </div>

          <div>
            <p className="text-white text-sm">Email</p>
            <a href="mailto:hello@caffiq.com" className="hover:text-white transition">
              hello@caffiq.com
            </a>
          </div>

          <div>
            <p className="text-white text-sm">Support</p>
            <p>support@caffiq.com</p>
          </div>

        </div>

      </div>

      <div className="
        px-30 py-6
        border-t border-white/5
        text-gray-500 text-sm
        flex justify-between
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