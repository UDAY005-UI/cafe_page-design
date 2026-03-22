export default function MenuPage() {

  const menuSections = [
    {
      label: "Espresso",
      tag: "Bold & Pure",
      items: [
        { name: "Ristretto",      desc: "Concentrated & velvety, brewed short",         price: "₹160", cal: "5 kcal"   },
        { name: "Americano",      desc: "Espresso stretched with hot water",             price: "₹170", cal: "10 kcal"  },
        { name: "Double Shot",    desc: "Two pulls, twice the soul",                     price: "₹190", cal: "10 kcal"  },
        { name: "Cortado",        desc: "Equal parts espresso & steamed milk",           price: "₹200", cal: "40 kcal"  },
      ],
    },
    {
      label: "Latte",
      tag: "Smooth & Creamy",
      items: [
        { name: "Caramel Latte",  desc: "Silky caramel kissed with espresso",           price: "₹220", cal: "180 kcal" },
        { name: "Vanilla Dream",  desc: "Soft vanilla swirled into warm milk",          price: "₹210", cal: "170 kcal" },
        { name: "Hazelnut Latte", desc: "Nutty warmth in every sip",                    price: "₹230", cal: "190 kcal" },
        { name: "Matcha Latte",   desc: "Earthy Japanese green tea meets steamed milk", price: "₹240", cal: "140 kcal" },
      ],
    },
    {
      label: "Cold",
      tag: "Chilled & Bold",
      items: [
        { name: "Cold Brew",      desc: "12-hour steeped, ice cold perfection",         price: "₹260", cal: "15 kcal"  },
        { name: "Iced Mocha",     desc: "Dark chocolate meets bold cold coffee",        price: "₹250", cal: "200 kcal" },
        { name: "Frappe",         desc: "Blended, frothy & dangerously smooth",         price: "₹270", cal: "230 kcal" },
        { name: "Iced Americano", desc: "Bold, black, over ice — no compromise",        price: "₹190", cal: "10 kcal"  },
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#150c01] pt-20">

      {/* ── HERO ── */}
      <div className="px-10 pt-10 pb-16 max-w-3xl">
        <h1 className="text-white text-6xl font-serif leading-tight mb-6">
          Our Menu
        </h1>
        <p className="text-white/50 text-base leading-relaxed">
          Every cup on this list is brewed with precision, passion, and a touch of elegance.
          From bold espresso pulls to slow cold brews — there&apos;s something for every mood.
        </p>
      </div>

      {/* ── DIVIDER ── */}
      <div className="px-10">
        <div className="w-full h-px bg-white/10" />
      </div>

      {/* ── MENU SECTIONS ── */}
      <div className="px-10 py-16 max-w-5xl mx-auto flex flex-col gap-20">
        {menuSections.map((section, si) => (
          <div key={si}>

            {/* Section header */}
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[#BE6B01] text-xs tracking-[0.2em] uppercase mb-1">
                  {section.tag}
                </p>
                <h2 className="text-white text-4xl font-serif italic">
                  {section.label}
                </h2>
              </div>
              <div className="h-px flex-1 bg-white/10 mx-8 mb-3" />
              <span className="text-white/30 text-sm mb-1">
                {section.items.length} items
              </span>
            </div>

            {/* Items */}
            <div className="flex flex-col divide-y divide-white/5">
              {section.items.map((item, ii) => (
                <div
                  key={ii}
                  className="flex items-center justify-between py-5 group hover:bg-white/[0.02] -mx-4 px-4 rounded-xl transition-colors duration-200"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-white text-base font-medium tracking-wide group-hover:text-[#BE6B01] transition-colors duration-200">
                      {item.name}
                    </span>
                    <span className="text-white/40 text-sm italic">
                      {item.desc}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 shrink-0 ml-8">
                    <span className="text-white/20 text-xs">
                      {item.cal}
                    </span>
                    <span className="text-[#BE6B01] text-base font-semibold min-w-[60px] text-right">
                      {item.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}