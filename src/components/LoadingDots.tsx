export default function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="size-3 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="size-3 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="size-3 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  );
}
