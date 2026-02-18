import { CardSection, StockCard, TextBadge } from "@/components";
import type { InvestmentStockCardItem } from "@/hooks";

export interface InvestmentListWidgetProps {
  deleteActionLabel: string;
  emptyHint: string;
  emptyTitle: string;
  errorLabel: string;
  errorMessage: string | null;
  isLoading: boolean;
  items: InvestmentStockCardItem[];
  listTitle: string;
  loadingLabel: string;
  onDelete: (id: string) => void;
  onStockClick?: (index: number) => void;
}

export function InvestmentListWidget({
  deleteActionLabel,
  emptyHint,
  emptyTitle,
  errorLabel,
  errorMessage,
  isLoading,
  items,
  listTitle,
  loadingLabel,
  onDelete,
  onStockClick,
}: InvestmentListWidgetProps) {
  return (
    <CardSection
      title={listTitle}
      titleClassName="text-base font-semibold text-[#18181B] font-['Outfit']"
      gap="gap-3"
    >
      {isLoading && items.length === 0 && (
        <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
      )}

      {!isLoading && errorMessage && (
        <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
      )}

      {!isLoading && !errorMessage && items.length === 0 && (
        <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
          <span className="block text-sm font-semibold text-black font-['Outfit']">{emptyTitle}</span>
          <span className="block text-xs font-medium text-[#71717A] mt-1">{emptyHint}</span>
        </div>
      )}

      {items.map((item, index) => (
        <div key={item.id} className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <TextBadge
              text={item.priceSourceLabel}
              bg={item.priceSource === "manual" ? "bg-[#FEF3C7]" : "bg-[#E4E4E7]"}
              textColor={item.priceSource === "manual" ? "text-[#92400E]" : "text-[#3F3F46]"}
              rounded="rounded-lg"
              padding="px-2 py-1"
              fontSize="text-[10px]"
              fontWeight="font-semibold"
            />
          </div>

          <StockCard
            ticker={item.stock.ticker}
            name={item.stock.name}
            exchange={item.stock.exchange}
            changeText={item.stock.changeText}
            changeColor={item.stock.changeColor}
            changeBg={item.stock.changeBg}
            row1={item.stock.row1}
            row2={item.stock.row2}
            onClick={() => onStockClick?.(index)}
          />
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="w-fit text-xs font-medium text-[#71717A]"
          >
            {deleteActionLabel}
          </button>
        </div>
      ))}
    </CardSection>
  );
}
