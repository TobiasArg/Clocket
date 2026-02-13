import type { NavItem, StockCard as StockCardType } from "@/types";
import { Avatar } from "@/components";
import { IconBadge } from "@/components";
import { TextBadge } from "@/components";
import { StatDisplay } from "@/components";
import { BottomNavigation } from "@/components";
import { CardSection } from "@/components";
import { StockCard } from "@/components";
import { SummaryPanel } from "@/components";

export interface InvestmentsProps {
  avatarInitials?: string;
  avatarBg?: string;
  headerTitle?: string;
  addButtonBg?: string;
  summaryTitle?: string;
  totalLabel?: string;
  totalValue?: string;
  gainLabel?: string;
  gainValue?: string;
  gainValueColor?: string;
  gainPercentText?: string;
  gainPercentColor?: string;
  gainPercentBg?: string;
  listTitle?: string;
  stocks?: StockCardType[];
  navItems?: NavItem[];
  onAddClick?: () => void;
  onStockClick?: (index: number) => void;
  onNavItemClick?: (index: number) => void;
}

export function Investments({
  avatarInitials = "JS",
  avatarBg = "bg-[#10B981]",
  headerTitle = "Inversiones",
  addButtonBg = "bg-[#10B981]",
  summaryTitle = "Resumen del Portfolio",
  totalLabel = "Valor Total",
  totalValue = "$12,450.00",
  gainLabel = "Ganancia/Pérdida",
  gainValue = "+$1,234.56",
  gainValueColor = "text-[#10B981]",
  gainPercentText = "+11.02%",
  gainPercentColor = "text-[#10B981]",
  gainPercentBg = "bg-[#D1FAE5]",
  listTitle = "Mis Acciones",
  stocks = [
    {
      ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ: AAPL",
      changeText: "+2.34%", changeColor: "text-[#10B981]", changeBg: "bg-[#D1FAE5]",
      row1: [
        { label: "Precio Actual", value: "$178.50" },
        { label: "Cantidad", value: "15 acc." },
        { label: "Valor Total", value: "$2,677.50" },
      ],
      row2: [
        { label: "Costo Promedio", value: "$165.20" },
        { label: "Invertido", value: "$2,478.00" },
        { label: "Ganancia", value: "+$199.50", valueColor: "text-[#10B981]" },
      ],
    },
    {
      ticker: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ: TSLA",
      changeText: "-1.87%", changeColor: "text-[#DC2626]", changeBg: "bg-[#FEE2E2]",
      row1: [
        { label: "Precio Actual", value: "$245.30" },
        { label: "Cantidad", value: "8 acc." },
        { label: "Valor Total", value: "$1,962.40" },
      ],
      row2: [
        { label: "Costo Promedio", value: "$268.75" },
        { label: "Invertido", value: "$2,150.00" },
        { label: "Pérdida", value: "-$187.60", valueColor: "text-[#DC2626]" },
      ],
    },
  ],
  navItems = [
    { icon: "house", label: "Home" },
    { icon: "wallet", label: "Budgets" },
    { icon: "chart-pie-slice", label: "Statistics" },
    { icon: "trend-up", label: "Inversiones", active: true },
    { icon: "dots-three-outline", label: "Más" },
  ],
  onAddClick,
  onStockClick,
  onNavItemClick,
}: InvestmentsProps) {
  return (
    <div className="flex flex-col h-full w-full bg-[#F5F5F5]">
      <div className="flex items-center justify-between px-5 py-4 bg-white">
        <div className="flex items-center gap-3">
          <Avatar
            initials={avatarInitials}
            bg={avatarBg}
            size="w-[40px] h-[40px]"
            textSize="text-sm"
            className="rounded-[20px]"
          />
          <span className="text-xl font-semibold text-[#18181B] font-['Outfit']">{headerTitle}</span>
        </div>
        <button type="button" onClick={onAddClick} aria-label="Agregar inversión">
          <IconBadge
            icon="plus"
            bg={addButtonBg}
            size="w-[40px] h-[40px]"
            rounded="rounded-[20px]"
          />
        </button>
      </div>

      <SummaryPanel
        title={summaryTitle}
        titleClassName="text-sm font-medium text-[#71717A] font-['Outfit']"
        bg="bg-white"
        padding="px-5 py-4"
        gap="gap-4"
      >
        <div className="flex justify-between w-full">
          <StatDisplay
            label={totalLabel}
            value={totalValue}
            labelClassName="text-xs font-normal text-[#71717A]"
            valueClassName="text-2xl font-bold text-[#18181B] font-['Outfit']"
          />
          <div className="flex flex-col gap-1 items-end">
            <span className="text-xs font-normal text-[#71717A]">{gainLabel}</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold font-['Outfit'] ${gainValueColor}`}>{gainValue}</span>
              <TextBadge
                text={gainPercentText}
                bg={gainPercentBg}
                textColor={gainPercentColor}
                rounded="rounded-lg"
                padding="px-2 py-1"
                fontSize="text-xs"
                fontWeight="font-medium"
              />
            </div>
          </div>
        </div>
      </SummaryPanel>

      <div className="flex-1 overflow-auto px-5 py-4">
        <CardSection
          title={listTitle}
          titleClassName="text-base font-semibold text-[#18181B] font-['Outfit']"
          gap="gap-3"
        >
          {stocks.map((stock, i) => (
            <StockCard
              key={stock.ticker}
              ticker={stock.ticker}
              name={stock.name}
              exchange={stock.exchange}
              changeText={stock.changeText}
              changeColor={stock.changeColor}
              changeBg={stock.changeBg}
              row1={stock.row1}
              row2={stock.row2}
              onClick={() => onStockClick?.(i)}
            />
          ))}
        </CardSection>
      </div>

      <BottomNavigation
        items={navItems}
        activeColor="text-[#10B981]"
        onItemClick={onNavItemClick}
      />
    </div>
  );
}
