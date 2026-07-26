export default function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="size-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="size-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="size-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  );
}
