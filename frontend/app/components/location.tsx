"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import caffiq from "../../public/caffiq.png";
import cup from "../../public/cup.png";

export default function Location() {
  return (
    <section id="location" className="w-full px-6 sm:px-12 lg:px-24 xl:px-30 pb-16 sm:pb-20 lg:pb-24">

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">

        {/* Left: text + cup */}
        <motion.div
          className="flex flex-col gap-6 max-w-md w-full"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >

          <motion.p
            className="text-[#d4a762] text-sm tracking-widest uppercase"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
          >
            Visit Us
          </motion.p>

          <motion.h1
            className="text-white text-4xl sm:text-5xl font-serif leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            Caffiq
          </motion.h1>

          <motion.p
            className="text-gray-300 text-base leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
          >
            A quiet escape in the heart of the city. Crafted for slow mornings,
            late conversations, and moments that linger beyond the last sip.
          </motion.p>

          <motion.div
            className="relative mt-10 lg:mt-14 self-start"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
          >

            <div className="
              absolute -bottom-20 -left-17.5
              w-70 h-80
              rounded-full
              bg-[radial-gradient(circle,rgba(255,255,255,0.35)_0%,rgba(212,167,98,0.45)_30%,rgba(120,60,20,0.35)_60%,transparent_80%)]
              blur-3xl
              opacity-90
            " />

            <div className="
              absolute -bottom-20 left-5
              w-100 h-200
              rounded-full
              bg-[radial-gradient(circle,rgba(212,167,98,0.25)_0%,rgba(90,40,10,0.25)_50%,transparent_75%)]
              blur-[120px]
            " />

            <motion.div
              whileHover={{ rotate: -10, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Image
                src={cup}
                alt="cup"
                className="
                  relative w-32 sm:w-44 h-auto
                  rotate-[-14deg]
                  hover:rotate-[-10deg]
                  transition-all duration-500
                "
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Center: location image — hidden on mobile */}
        <motion.div
          className="hidden lg:block shrink-0"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Image
            src={caffiq}
            alt="Caffiq location"
            className="w-120 xl:w-150 rounded-3xl"
          />
        </motion.div>

        {/* Right: info */}
        <motion.div
          className="flex flex-col justify-between gap-8 lg:gap-0 lg:h-120 max-w-sm w-full"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >

          <div className="flex flex-col gap-5">

            <div className="w-8 h-0.5 bg-[#d4a762]" />

            <h2 className="text-white text-2xl font-semibold">
              Find Us
            </h2>

            <p className="text-gray-300 text-sm leading-relaxed">
              Step into a space where aroma, warmth, and craftsmanship come together.
              Whether it&apos;s a quick espresso or a slow evening, we invite you to pause,
              unwind, and experience coffee the way it&apos;s meant to be.
            </p>

          </div>

          {/* Mobile-only: show image between text blocks */}
          <motion.div
            className="block lg:hidden w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Image
              src={caffiq}
              alt="Caffiq location"
              className="w-full rounded-3xl"
            />
          </motion.div>

          <div className="flex flex-col gap-4 text-gray-300 text-sm">

            <div>
              <p className="text-white mb-1">Address</p>
              <p>
                21 Park Street, Kolkata<br />
                West Bengal 700016
              </p>
            </div>

            <div>
              <p className="text-white mb-1">Hours</p>
              <p>Mon – Sun • 8:00 AM – 9:00 PM</p>
            </div>
          </div>

        </motion.div>

      </div>

    </section>
  );
}