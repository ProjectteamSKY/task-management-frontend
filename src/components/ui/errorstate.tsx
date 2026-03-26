interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <p className="text-destructive text-sm">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-1.5 text-xs rounded-md bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}