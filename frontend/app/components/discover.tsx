import show1 from "../../public/show1.jpg";
import show2 from "../../public/show2.jpg";
import show3 from "../../public/show3.jpg";
import show4 from "../../public/show4.jpg";
import Image from "next/image";

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
    tag: "Chef’s Pick",
    name: "Choco Delight",
    desc: "Decadent, creamy, irresistible.",
  },
];

export default function Discover() {
  return (
    <div id="discover" className="w-full px-30 py-24">
      
      <h1 className="text-center text-5xl font-serif text-white mb-16">
        Caffiq Favorites
      </h1>

      <div className="flex gap-10 justify-center">
        {items.map((item, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-3xl group"
          >
            
            <Image
              src={item.img}
              alt="coffee"
              className="w-80 h-[500px] object-cover transition duration-500 group-hover:scale-105"
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

              <button className="
                mt-2 w-full py-2 rounded-full
                bg-[#c49a45]
                text-black text-sm font-medium
                hover:bg-[#d6aa5a]
                transition-all duration-300
              ">
                Order Now →
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}