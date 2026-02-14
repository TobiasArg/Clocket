import type { StockMetric } from "@/types";
import { Divider } from "@/components";
import { TextBadge } from "@/components";
import { MetricGrid } from "@/components";

export interface StockCardProps {
  ticker: string;
  name: string;
  exchange: string;
  changeText: string;
  changeColor: string;
  changeBg: string;
  row1: StockMetric[];
  row2: StockMetric[];
  tickerBg?: string;
  tickerTextColor?: string;
  nameClassName?: string;
  exchangeClassName?: string;
  onClick?: () => void;
  className?: string;
}

export function StockCard({
  ticker,
  name,
  exchange,
  changeText,
  changeColor,
  changeBg,
  row1,
  row2,
  tickerBg = "bg-[#18181B]",
  tickerTextColor = "text-white",
  nameClassName = "text-base font-semibold text-[#18181B] font-['Outfit']",
  exchangeClassName = "text-xs font-normal text-[#71717A]",
  onClick,
  className = "",
}: StockCardProps) {
  const classes = `flex flex-col gap-3 bg-white rounded-2xl p-4 text-left ${className}`;

  const content = (
    <>
      <div className="flex min-w-0 items-center justify-between w-full gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className={`flex shrink-0 items-center justify-center w-[44px] h-[44px] rounded-xl ${tickerBg}`}>
            <span className={`text-[10px] font-bold font-['Outfit'] ${tickerTextColor}`}>{ticker}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className={`block truncate ${nameClassName}`}>{name}</span>
            <span className={`block truncate ${exchangeClassName}`}>{exchange}</span>
          </div>
        </div>
        <TextBadge
          text={changeText}
          bg={changeBg}
          textColor={changeColor}
          rounded="rounded-lg"
          padding="px-2.5 py-1.5"
          fontSize="text-xs"
          fontWeight="font-semibold"
          className="max-w-[108px] shrink-0"
        />
      </div>

      <Divider />

      <MetricGrid
        metrics={row1}
        labelClassName="text-[11px] font-normal text-[#71717A]"
        valueClassName="text-base font-semibold font-['Outfit'] text-[#18181B]"
      />

      <MetricGrid
        metrics={row2}
        labelClassName="text-[11px] font-normal text-[#71717A]"
        valueClassName="text-base font-semibold font-['Outfit'] text-[#18181B]"
      />
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }

  return <div className={classes}>{content}</div>;
}
