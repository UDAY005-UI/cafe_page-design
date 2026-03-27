"use client";

import { motion } from "framer-motion";

export default function FinalCTA() {
  return (
    <section className="w-full flex justify-center px-6 sm:px-12 pb-20 sm:pb-24 lg:pb-32">

      <motion.div
        className="text-center max-w-2xl flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
      >

        <motion.p
          className="text-[#d4a762] text-sm tracking-widest uppercase"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          viewport={{ once: true }}
        >
          Ready to Explore
        </motion.p>

        <motion.h2
          className="text-white text-3xl sm:text-4xl lg:text-5xl font-serif leading-tight"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          viewport={{ once: true }}
        >
          Your perfect cup is waiting
        </motion.h2>

        <motion.p
          className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          viewport={{ once: true }}
        >
          Discover a thoughtfully crafted menu featuring signature blends,
          seasonal specials, and timeless coffee experiences.
        </motion.p>

        <motion.button
          className="
            mt-4 sm:mt-6 px-7 sm:px-8 py-3 sm:py-4 rounded-full
            bg-[#c49a45] text-black text-sm font-medium
            hover:bg-[#d6aa5a]
            transition-all duration-300
          "
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          viewport={{ once: true }}
        >
          View Menu →
        </motion.button>

      </motion.div>
    </section>
  );
}