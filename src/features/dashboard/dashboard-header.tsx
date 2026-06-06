export function DashboardHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff5a1f]">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7a746e]">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
