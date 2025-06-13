import { useState, useEffect } from "react";

const testimonials = [
  {
    quote: "Ambixous is what networking *should* feel like.",
    name: "Product Lead, Zomato"
  },
  {
    quote: "I met my co-founder here. No joke.",
    name: "Designpreneur"
  },
  {
    quote: "Better than any Zoom webinar I’ve sat through.",
    name: "Tech Student, IIT Delhi"
  }
];

export default function TestimonialSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const { quote, name } = testimonials[index];

  return (
    <section className="py-12 text-center">
      <blockquote className="text-xl italic text-white max-w-2xl mx-auto">
        “{quote}”
      </blockquote>
      <p className="text-lilac mt-4">– {name}</p>
    </section>
  );
}
