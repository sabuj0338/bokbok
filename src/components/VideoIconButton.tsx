type Props = {
  status: boolean;
  onClick?: () => void;
};
export default function VideoIconButton({ status, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer px-3 py-3 text-zinc-300 bg-zinc-700 rounded-full hover:bg-zinc-600 active:bg-zinc-700"
    >
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
        {status ? (
          <>
            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
            <rect x="2" y="6" width="14" height="12" rx="2" />
          </>
        ) : (
          <>
            <path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196" />
            <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
            <path d="m2 2 20 20" />
          </>
        )}
      </svg>
    </button>
  );
}
