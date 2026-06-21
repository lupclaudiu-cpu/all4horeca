export function AntoriaBrand({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="relative grid size-10 place-items-center overflow-hidden rounded-[14px] bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 shadow-lg shadow-blue-950/20">
        <span className="absolute -right-2 -top-2 size-6 rounded-full border border-white/40" />
        <span className="absolute bottom-1 left-1 size-2 rounded-full bg-amber-300" />
        <span className="text-xs font-black tracking-[-0.08em] text-white">A4</span>
      </span>
      {!compact && (
        <span>
          <span className={`block text-[15px] font-black tracking-[0.16em] ${inverse ? "text-white" : "text-slate-950"}`}>
            ALL4HORECA
          </span>
          <span className={`block text-[9px] font-bold uppercase tracking-[0.2em] ${inverse ? "text-cyan-200/70" : "text-slate-400"}`}>
            by ANTORIA
          </span>
        </span>
      )}
    </span>
  );
}
