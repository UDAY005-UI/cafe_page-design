import Image from "next/image";
import caffiq from "../../public/caffiq.png";
import cup from "../../public/cup.png";

export default function Location() {
  return (
    <section id="location" className="w-full px-30 pb-24">

      <div className="flex gap-20 items-center">

        <div className="flex flex-col gap-6 max-w-md">

          <p className="text-[#d4a762] text-sm tracking-widest uppercase">
            Visit Us
          </p>

          <h1 className="text-white text-5xl font-serif leading-tight">
            Caffiq
          </h1>

          <p className="text-gray-300 text-base leading-relaxed">
            A quiet escape in the heart of the city. Crafted for slow mornings,
            late conversations, and moments that linger beyond the last sip.
          </p>

          <div className="relative mt-14">

  <div className="
    absolute -bottom-20 left-[-70]
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

  <Image
    src={cup}
    alt="cup"
    className="
      relative w-44 h-auto
      rotate-[-14deg]
      hover:rotate-[-10deg]
      transition-all duration-500
    "
  />

</div>

        </div>

        <div>
          <Image
            src={caffiq}
            alt="Caffiq location"
            className="w-300 rounded-3xl"
          />
        </div>

        <div className="flex flex-col justify-between h-120 max-w-sm">

          <div className="flex flex-col gap-5">

            <div className="w-8 h-0.5 bg-[#d4a762]" />

            <h2 className="text-white text-2xl font-semibold">
              Find Us
            </h2>

            <p className="text-gray-300 text-sm leading-relaxed">
              Step into a space where aroma, warmth, and craftsmanship come together.
              Whether it’s a quick espresso or a slow evening, we invite you to pause,
              unwind, and experience coffee the way it’s meant to be.
            </p>

          </div>

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
              <p>
                Mon – Sun • 8:00 AM – 9:00 PM
              </p>
            </div>

            <button className="
              mt-4 w-fit px-6 py-3 rounded-full
              bg-[#c49a45] text-black text-sm font-medium
              hover:bg-[#d6aa5a]
              transition-all duration-300
            ">
              Get Directions →
            </button>

          </div>

        </div>

      </div>

    </section>
  );
}