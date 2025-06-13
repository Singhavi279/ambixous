export default function CommunityPage() {
  return (
    <section className="p-8 text-center">
      <h1 className="text-4xl font-bold text-lilac mb-4">The Ambixous Community</h1>
      <p className="text-white max-w-2xl mx-auto mb-6">
        This isn’t just a network — it’s a vibe. A tribe of builders, thinkers, doers. Want in?
      </p>
      <div className="mb-10">
        <iframe
          src="https://widgets.sociablekit.com/instagram-feed/iframe/23580438"
          width="100%"
          height="500"
          className="rounded-xl border border-lilac"
          loading="lazy"
          title="Ambixous Instagram Feed"
        ></iframe>
      </div>
      <div className="mb-10">
        <iframe
          src="https://widgets.sociablekit.com/linkedin-feed/iframe/23580457"
          width="100%"
          height="500"
          className="rounded-xl border border-lilac"
          loading="lazy"
          title="Ambixous LinkedIn Feed"
        ></iframe>
      </div>
      <p className="text-mint italic">Want to get featured? Tag us #BuiltByAmbixous</p>
    </section>
  );
}
