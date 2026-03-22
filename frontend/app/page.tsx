import Hero from "./components/hero";
import About from "./components/about";
import Discover from "./components/discover";
import Location from "./components/location";
import FinalCTA from "./components/finalCTA";

export default function Home() {
  return (
    <div className="gap-20 flex flex-col">
      <Hero/>
      <About/>
      <Discover/>
      <Location/>
      <FinalCTA/>
    </div>
  );
}
