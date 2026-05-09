export default function PersonalityCard({ title, value, accent }) {
  return (
    <div className={`rounded-lg bg-gradient-to-br ${accent} p-[1px]`}>
      <div className="rounded-lg bg-ink/90 p-4">
        <p className="text-sm uppercase tracking-[0.18em] text-white/60">{title}</p>
        <h3 className="mt-4 text-2xl font-semibold text-white">{value}</h3>
      </div>
    </div>
  );
}
