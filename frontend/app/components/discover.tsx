"use client";

import { motion } from "framer-motion";
import show1 from "../../public/show1.jpg";
import show2 from "../../public/show2.jpg";
import show3 from "../../public/show3.jpg";
import show4 from "../../public/show4.jpg";
import Image from "next/image";
import { useRouter } from "next/navigation";

const items = [
  {
    img: show1,
    tag: "Best Seller",
    name: "Mocha Indulgence",
    desc: "Rich chocolate meets bold espresso.",
  },
  {
    img: show2,
    tag: "Signature",
    name: "Classic Latte",
    desc: "Smooth, balanced, timeless.",
  },
  {
    img: show3,
    tag: "Trending",
    name: "Caramel Cream",
    desc: "Sweet layers with a velvety finish.",
  },
  {
    img: show4,
    tag: "Chef's Pick",
    name: "Choco Delight",
    desc: "Decadent, creamy, irresistible.",
  },
];

export default function Discover() {
  const router = useRouter();

  return (
    <div id="discover" className="w-full px-6 sm:px-12 lg:px-24 xl:px-30 py-16 sm:py-20 lg:py-24">

      <motion.h1
        className="text-center text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-10 sm:mb-12 lg:mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        Caffiq Favorites
      </motion.h1>

      <div
        className="
          grid gap-6
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        {items.map((item, index) => (
          <motion.div
            key={index}
            className="relative overflow-hidden rounded-3xl group"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15, duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Image
              src={item.img}
              alt="coffee"
              className="w-full h-105 sm:h-115 lg:h-125 object-cover transition duration-500 group-hover:scale-105"
            />

            <span className="
              absolute top-4 left-4 z-20
              px-4 py-1 text-xs tracking-wide
              rounded-full
              border border-white/30
              text-white
            ">
              {item.tag}
            </span>

            <div className="
              absolute inset-0
              bg-linear-to-t from-black/50 via-transparent to-transparent
            " />

            <div className="
              absolute bottom-6 left-6 right-6 z-20
              flex flex-col gap-1
            ">
              <h2 className="text-white text-lg font-semibold">
                {item.name}
              </h2>

              <p className="text-sm text-gray-300">
                {item.desc}
              </p>

              <motion.button 
                className="
                  mt-2 w-full py-2 rounded-full
                  bg-[#c49a45]
                  text-black text-sm font-medium
                  hover:bg-[#d6aa5a]
                  transition-all duration-300
                "
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/menu")}
              >
                Order Now →
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}