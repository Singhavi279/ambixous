export default function OutlineButton({ label }: { label: string }) {
  return (
    <button className="border border-lilac text-lilac font-semibold px-6 py-3 rounded-xl hover:bg-lilac hover:text-midnight transition-colors">
      {label}
    </button>
  );
}
