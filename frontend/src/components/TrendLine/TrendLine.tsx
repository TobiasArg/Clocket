export interface TrendLineProps {
  className?: string;
}

export function TrendLine({ className = "" }: TrendLineProps) {
  return (
    <div className={`w-full h-[80px] relative ${className}`}>
      <svg viewBox="0 0 280 80" className="w-full h-full" preserveAspectRatio="none">
        <polyline
          points="0,60 50,60 100,40 150,50 200,20 250,10"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
        />
        <polyline
          points="150,50 200,20 250,10"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
        <circle cx="200" cy="20" r="4" fill="white" />
        <circle cx="250" cy="10" r="4" fill="white" />
      </svg>
    </div>
  );
}
