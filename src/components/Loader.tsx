interface LoaderProps {
  message?: string;
  className?: string;
  useDots?: boolean;
}

export function Loader({ message, className = '', useDots = false }: LoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {useDots ? (
        <div className="flex gap-1.5">
          <span className="loader-dot" />
          <span className="loader-dot" />
          <span className="loader-dot" />
        </div>
      ) : (
        <div className="relative flex items-center justify-center">
          <div className="loader-spinner" />
          <div className="loader-spinner-inner" />
        </div>
      )}
      {message && (
        <p className="text-white/70 text-sm font-medium tracking-wide animate-pulse-soft">
          {message}
        </p>
      )}
    </div>
  );
}
