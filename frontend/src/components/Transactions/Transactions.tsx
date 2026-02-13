import type { MonthGroup } from "@/types";
import { IconBadge } from "@/components";
import { ListItemRow } from "@/components";
import { CardSection } from "@/components";
import { PageHeader } from "@/components";

export interface TransactionsProps {
  headerTitle?: string;
  months?: MonthGroup[];
  onBackClick?: () => void;
  onFilterClick?: () => void;
  onTransactionClick?: (monthIndex: number, txIndex: number) => void;
}

export function Transactions({
  headerTitle = "Transacciones",
  months = [
    {
      title: "Febrero 2024",
      total: "-$2,456",
      totalColor: "text-[#DC2626]",
      transactions: [
        { icon: "fork-knife", iconBg: "bg-[#DC2626]", name: "McDonald's", category: "Alimentación • Restaurantes", amount: "-$12.50", amountColor: "text-[#DC2626]", meta: "15 Feb • Tarjeta" },
        { icon: "car", iconBg: "bg-[#2563EB]", name: "Uber", category: "Transporte • Taxi", amount: "-$8.75", amountColor: "text-[#DC2626]", meta: "14 Feb • Efectivo" },
        { icon: "briefcase", iconBg: "bg-[#16A34A]", name: "Salario Mensual", category: "Ingresos • Trabajo", amount: "+$3,500", amountColor: "text-[#16A34A]", meta: "10 Feb • Tarjeta" },
        { icon: "shopping-bag", iconBg: "bg-[#EA580C]", name: "Amazon", category: "Compras • Online", amount: "-$156.00", amountColor: "text-[#DC2626]", meta: "8 Feb • Tarjeta" },
      ],
    },
    {
      title: "Enero 2024",
      total: "-$1,890",
      totalColor: "text-[#DC2626]",
      transactions: [
        { icon: "lightning", iconBg: "bg-[#0891B2]", name: "Luz Eléctrica", category: "Servicios • Electricidad", amount: "-$85.00", amountColor: "text-[#DC2626]", meta: "28 Ene • Tarjeta" },
        { icon: "game-controller", iconBg: "bg-[#7C3AED]", name: "Netflix", category: "Entretenimiento • Streaming", amount: "-$15.99", amountColor: "text-[#DC2626]", meta: "25 Ene • Tarjeta" },
        { icon: "heart", iconBg: "bg-[#059669]", name: "Farmacia", category: "Salud • Medicamentos", amount: "-$42.30", amountColor: "text-[#DC2626]", meta: "20 Ene • Efectivo" },
        { icon: "briefcase", iconBg: "bg-[#16A34A]", name: "Salario Mensual", category: "Ingresos • Trabajo", amount: "+$3,500", amountColor: "text-[#16A34A]", meta: "10 Ene • Tarjeta" },
      ],
    },
  ],
  onBackClick,
  onFilterClick,
  onTransactionClick,
}: TransactionsProps) {
  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader
        title={headerTitle}
        onBackClick={onBackClick}
        onActionClick={onFilterClick}
        actionIcon="funnel"
      />
      <div className="flex-1 overflow-auto px-5 py-2">
        <div className="flex flex-col gap-6">
          {months.map((month, mi) => (
            <CardSection
              key={month.title}
              title={month.title}
              titleClassName="text-lg font-bold text-black font-['Outfit']"
              action={
                <span className={`text-base font-semibold font-['Outfit'] ${month.totalColor ?? "text-black"}`}>
                  {month.total}
                </span>
              }
              gap="gap-3"
            >
              {month.transactions.map((tx, ti) => (
                <ListItemRow
                  key={`${tx.name}-${tx.meta}`}
                  left={<IconBadge icon={tx.icon} bg={tx.iconBg} />}
                  title={tx.name}
                  subtitle={tx.category}
                  titleClassName="text-[15px] font-semibold text-black font-['Outfit']"
                  subtitleClassName="text-[11px] font-medium text-[#71717A] truncate"
                  right={
                    <div className="flex flex-col gap-0.5 items-end shrink-0">
                      <span className={`text-[15px] font-bold font-['Outfit'] ${tx.amountColor}`}>
                        {tx.amount}
                      </span>
                      <span className="text-[10px] font-medium text-[#A1A1AA]">{tx.meta}</span>
                    </div>
                  }
                  onClick={() => onTransactionClick?.(mi, ti)}
                  showBorder={ti < month.transactions.length - 1}
                  padding="py-3.5"
                />
              ))}
            </CardSection>
          ))}
        </div>
      </div>
    </div>
  );
}
