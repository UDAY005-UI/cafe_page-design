export default function FinalCTA() {
  return (
    <section className="w-full flex justify-center">

      <div className="text-center max-w-2xl flex flex-col items-center gap-6">

        <p className="text-[#d4a762] text-sm tracking-widest uppercase">
          Ready to Explore
        </p>

        <h2 className="text-white text-5xl font-serif leading-tight">
          Your perfect cup is waiting
        </h2>

        <p className="text-gray-300 text-base leading-relaxed max-w-xl">
          Discover a thoughtfully crafted menu featuring signature blends,
          seasonal specials, and timeless coffee experiences.
        </p>

        <button className="
          mt-6 px-8 py-4 rounded-full
          bg-[#c49a45] text-black text-sm font-medium
          hover:bg-[#d6aa5a]
          transition-all duration-300
        ">
          View Menu →
        </button>

      </div>

    </section>
  );
}