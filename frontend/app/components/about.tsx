import Image from "next/image"
import coffee from "../../public/coffee.jpg"
import crossiant from "../../public/crossiant.jpg";
export default function About() {
    return (
    <section id="about" className="w-full h-auto px-30">
        <div className="flex items-center justify-center text-5xl font-semibold pb-15">About Our Cafe</div>
        <div className="flex flex-col gap-20">
            <div className="flex justify-between">
                <div className="relative flex flex-col z-10 items-start justify-center gap-4">
                <p className="text-[#ffd28c]">Refined Origins</p>

                <h1 className="text-white text-3xl font-bold font-serif">
                    A Story in Every Pour
                </h1>

                <p className="text-gray-300 mt-4 max-w-md">
                   Each cup begins long before it reaches your table. From carefully nurtured farms to precise roasting, we shape every detail to create a coffee experience that feels intentional, balanced, and quietly indulgent.
                </p>
                <button className="bg-[#c49a45] p-3 w-50 rounded-3xl text-black">Step Inside →</button>
            </div>
                <div>
                    <Image src={coffee} alt="coffee" className="w-150 h-auto rounded-3xl"/>
                </div>
            </div>
            <div className="flex justify-between">
                <div>
                    <Image src={crossiant} alt="crossiant" className="w-150 h-auto rounded-3xl"/>
                </div>
                <div className="relative flex flex-col z-10 items-start justify-center gap-4">
                <p className="text-[#ffd28c]">Beyond Brewing</p>

                <h1 className="text-white text-3xl font-bold font-serif">
                    An Elevated Experience
                </h1>

                <p className="text-gray-300 mt-4 max-w-md">
                    This is not just coffee—it’s a composition of flavor, texture, and aroma. Designed to slow you down and draw you in, one sip at a time.
                </p>
                <button className="bg-[#c49a45] p-3 text-black w-50 rounded-3xl">Explore Further →</button>
            </div>
            </div>
        </div>
    </section>
    )
}