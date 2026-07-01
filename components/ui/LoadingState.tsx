interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = "Loading…",
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="spinner" aria-hidden />
      <p className="text-body-md text-muted">{message}</p>
    </div>
  );
}
