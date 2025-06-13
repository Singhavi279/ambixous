export default function EventsPage() {
  return (
    <section className="p-8 text-center">
      <h1 className="text-4xl font-bold text-lilac mb-4">Our Events</h1>
      <p className="text-white max-w-2xl mx-auto mb-6">
        From founder firesides to design jams, here's where Ambixous magic unfolds. Stay tuned!
      </p>
      <div className="mb-8">
        <iframe
          src="https://commudle.com/communities/ambixous"
          width="100%"
          height="600"
          className="rounded-xl border border-lilac"
          loading="lazy"
          title="Ambixous Events Feed"
        ></iframe>
      </div>
      <p className="text-mint italic">“I came for the snacks. Stayed for the serendipity.”</p>
    </section>
  );
}
