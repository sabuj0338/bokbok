type Props = {
  status: boolean;
  onClick?: () => void;
};

export default function ShareScreenIconButton({ status, onClick }: Props) {
  const className = status
    ? "cursor-pointer px-3 py-3 text-rose-300 bg-rose-700 rounded-full hover:bg-rose-600 active:bg-rose-700"
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
        <path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        {status ? (
          <>
            <path d="m22 3-5 5" />
            <path d="m17 3 5 5" />
          </>
        ) : (
          <>
            <path d="m17 8 5-5" />
            <path d="M17 3h5v5" />
          </>
        )}
      </svg>
    </button>
  );
}
