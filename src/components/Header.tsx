import ThemeSwitcher from "./ThemeSwitcher";

type Props = {
  socketId: string;
  roomId?: string;
};
export default function Header({ socketId, roomId }: Props) {
  return (
    <header className="mt-3 border border-zinc-300 dark:border-zinc-700 rounded px-2 flex justify-between items-center gap-2">
      <a href="/" className="font-bold text-center text-zinc-900 dark:text-white">
        Bok Bok
      </a>
      <p className="text-sm">
        <span className="text-zinc-400 dark:text-zinc-600">socket-id:</span>
        <span className="text-zinc-900 dark:text-white">{socketId}</span>
      </p>
      {roomId && (<p className="text-sm">
        <span className="text-zinc-400 dark:text-zinc-600">room-id:</span>
        <span className="text-zinc-900 dark:text-white">{roomId}</span>
      </p>)}
      <ThemeSwitcher />
    </header>
  );
}
