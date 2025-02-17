type Props = {
  status: boolean;
  onClick?: () => void;
};

export default function RecordIconButton({ status, onClick }: Props) {
  const className = status
    ? "cursor-pointer px-3 py-3 text-rose-300 bg-rose-700 rounded-full hover:bg-rose-600 active:bg-rose-700 opacity-50"
    : "cursor-pointer px-3 py-3 text-zinc-700 dark:text-zinc-300 bg-zinc-400 dark:bg-zinc-700 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-600 active:bg-zinc-400 dark:active:bg-zinc-700";

  return (
    <button type="button" onClick={onClick} className={className}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <path d="M16.75 12h3.632a1 1 0 0 1 .894 1.447l-2.034 4.069a1 1 0 0 1-1.708.134l-2.124-2.97" />
        <path d="M17.106 9.053a1 1 0 0 1 .447 1.341l-3.106 6.211a1 1 0 0 1-1.342.447L3.61 12.3a2.92 2.92 0 0 1-1.3-3.91L3.69 5.6a2.92 2.92 0 0 1 3.92-1.3z" />
        <path d="M2 19h3.76a2 2 0 0 0 1.8-1.1L9 15" />
        <path d="M2 21v-4" />
        <path d="M7 9h.01" />
      </svg>
    </button>
  );
}
