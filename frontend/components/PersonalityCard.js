export default function PersonalityCard({ title, value }) {
  return (
    <div className="relative z-[1] rounded-md border border-dashed border-stone-500 p-4">
      <p className="sketch-label text-stone-400">{title}</p>
      <h3 className="mt-2 font-display text-2xl font-semibold leading-snug text-stone-50">{value}</h3>
    </div>
  );
}
