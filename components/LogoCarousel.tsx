export default function LogoCarousel() {
  return (
    <section className="py-12 text-center">
      <h3 className="text-white text-xl mb-6">Featured By</h3>
      <div className="flex gap-6 justify-center items-center flex-wrap">
        {['Zomato', 'Microsoft', 'WTM', 'IIT Delhi', 'ThoughtWorks'].map((logo) => (
          <div key={logo} className="text-white border border-lilac px-4 py-2 rounded-xl">
            {logo}
          </div>
        ))}
      </div>
    </section>
  );
}
