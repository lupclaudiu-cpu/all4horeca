export function AntoriaBrand({
  compact = false,
  inverse = false,
}: {
  compact?: boolean;
  inverse?: boolean;
}) {
  const stroke = inverse ? "#EFE8DA" : "#173A2E";
  return (
    <span className="inline-flex items-center gap-3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 220 220"
        aria-hidden="true"
      >
        <path fill="none" stroke={stroke} strokeWidth="6.3" d="M50.8 190V86.4a59.2 59.2 0 0 1 118.4 0V190" />
        <path fill="none" stroke="#B88A44" strokeWidth="2.4" d="M62.8 190V86.4a47.2 47.2 0 0 1 94.4 0V190" />
        <path fill="none" stroke={stroke} strokeLinecap="square" strokeWidth="6.3" d="M36 190h148" />
        <path fill="#B88A44" d="M117.5 129q.3-1.2 1-2t1.6-1.5l12-10q1.3-.8 2-1 .7-.4 1.4-.4.8 0 1 .5.4.5 0 1.6l-11.1 42.6q-.5 1.4 0 2.2t2 1l4.4 1q1 .4 1.6 1 .5.5.2 1.5t-1.3 1.7-2.5.6H99.4q-1.6 0-2.2-.6t-.3-1.7q.3-1 1.2-1.6t2.2-.9l5.4-1q1.5-.1 2.5-1t1.5-2.5Zm-5.4-12.3q2.5-2 4.2-3.7 1.6-1.8 2-3.7.5-1.6.3-3l-.5-2.8-.5-3q-.1-1.6.3-3.4 1.2-4 4.6-6.5 3.3-2.6 8.3-2.6 4 0 6 2.2 2 2 1.1 5.8-.4 2.3-1.8 4.7-1.4 2.3-4 5-2.7 2.7-7 6.1l-40.2 34.3-.3-2H138q1.3 0 2 .5t.3 1.7-1.3 1.8-2.5.6H82q-1.6 0-2.2-.8-.5-.7-.2-2 .3-.7 1-1.6.8-.9 2.4-2Z" />
      </svg>
      {!compact && (
        <span
          className={`font-display block text-[17px] font-bold tracking-[0.14em] ${inverse ? "text-[#EFE8DA]" : "text-[#173A2E]"}`}
        >
          ALL4HORECA
        </span>
      )}
    </span>
  );
}
