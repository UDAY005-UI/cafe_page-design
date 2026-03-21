import Image from "next/image";
import coffee from "../../public/coffee4.png";

export default function Hero() {
    return (
        <section id="home" className="relative overflow-hidden w-full h-screen">
            <div>
                <div className="relative flex flex-col z-10 max-w-4xl pl-30 pt-32 gap-4">
                    <p className="text-[#ffd28c]">Artisan Coffee Experience</p>

                    <h1 className="text-white text-9xl font-serif">
                        Indulge <br /> in Every Sip
                    </h1>

                    <p className="text-gray-300 mt-4 max-w-xl">
                        From bean selection to the final pour, we craft each cup with precision, passion, and a touch of elegance. Every step of our process is thoughtfully curated—sourcing the finest beans, roasting to perfection, and brewing with care—to deliver a rich and unforgettable coffee experience. It’s not just a drink, but a moment to slow down, savor, and indulge in the art of coffee.
                    </p>
                    <button className="bg-[#c49a45] p-3 w-50 rounded-3xl text-black">Sip the experience →</button>
                </div>
                <div
                    className="absolute inset-0 h-full flex justify-end items-end px-30"
                    style={{
                        background: `
  radial-gradient(ellipse 28% 45% at 73% 15%, 
    rgba(255, 175, 85, 0.32) 0%, 
    rgba(255, 175, 85, 0.18) 35%, 
    rgba(255, 175, 85, 0.08) 65%, 
    rgba(255, 175, 85, 0.03) 85%, 
    transparent 100%
  ),
  radial-gradient(ellipse 35% 50% at 76% 52%, 
    rgba(255, 145, 65, 0.34) 0%, 
    rgba(255, 145, 65, 0.20) 40%, 
    rgba(255, 145, 65, 0.09) 70%, 
    rgba(255, 145, 65, 0.03) 90%, 
    transparent 100%
  ),
  radial-gradient(ellipse 20% 30% at 74% 70%, 
    rgba(255, 125, 50, 0.24) 0%, 
    rgba(255, 125, 50, 0.12) 50%, 
    rgba(255, 125, 50, 0.04) 80%, 
    transparent 100%
  ),
  linear-gradient(to bottom, 
    rgba(0,0,0,0) 35%, 
    rgba(0,0,0,0.25) 65%, 
    rgba(0,0,0,1) 95%
  ),
  linear-gradient(to right, 
    #000000 0%, 
    #000000 55%, 
    #000000 100%
  )
`
                    }}
                >
                    <Image src={coffee} alt="coffee" className="h-150 w-auto" />
                </div>
            </div>
        </section>
    )
}