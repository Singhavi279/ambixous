export default function Navbar() {
  return (
    <nav className="w-full px-6 py-4 flex justify-between items-center bg-midnight border-b border-lilac">
      <div className="text-lg font-bold text-lilac">Ambixous</div>
      <div className="hidden md:flex gap-6 text-white">
        <a href="/about">About</a>
        <a href="/events">Events</a>
        <a href="/services">Services</a>
        <a href="/community">Community</a>
        <a href="/contact">Contact</a>
      </div>
    </nav>
  );
}
