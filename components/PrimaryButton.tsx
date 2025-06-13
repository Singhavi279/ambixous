export default function PrimaryButton({ label }: { label: string }) {
  return (
    <button className="bg-lilac text-midnight font-semibold px-6 py-3 rounded-xl hover:scale-105 transition-transform">
      {label}
    </button>
  );
}
