export default function AcgBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -left-16 top-32 h-72 w-72 rounded-full bg-sakura/25 blur-3xl" />
      <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-cyan/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-violet-acg/15 blur-3xl" />
      <svg className="absolute right-[12%] top-[18%] h-8 w-8 text-gold/40" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
      </svg>
      <svg className="absolute left-[8%] top-[42%] h-5 w-5 text-sakura/50" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
      </svg>
      <svg className="absolute bottom-[22%] right-[20%] h-6 w-6 text-cyan/40" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
      </svg>
    </div>
  );
}
