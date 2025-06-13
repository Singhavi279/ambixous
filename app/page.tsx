import PrimaryButton from "../components/PrimaryButton";
import OutlineButton from "../components/OutlineButton";
import StatsBlock from "../components/StatsBlock";
import LogoCarousel from "../components/LogoCarousel";
import TestimonialSlider from "../components/TestimonialSlider";

export default function HomePage() {
  return (
    <>
      <section className="flex flex-col items-center justify-center text-center py-24 px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          We’re not another community...
        </h1>
        <p className="text-xl md:text-2xl mb-6">
          We’re the launchpad. For designers. Builders. Idea-hungry rebels.
        </p>
        <p className="text-lg italic text-mint mb-10">🚀 Innovation is messy. We just make it fun.</p>
        <div className="flex flex-wrap gap-4">
          <PrimaryButton label="Join the Movement" />
          <OutlineButton label="Explore Events" />
        </div>
      </section>
      <StatsBlock />
      <LogoCarousel />
      <TestimonialSlider />
    </>
  );
}
