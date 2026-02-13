import type { NavItem, Transaction, SpendingCategory, GoalCardSimple, CuotaItem } from "@/types";
import { Avatar } from "@/components";
import { IconBadge } from "@/components";
import { PhosphorIcon } from "@/components";
import { ListItemRow } from "@/components";
import { SpendingBar } from "@/components";
import { BottomNavigation } from "@/components";
import { CardSection } from "@/components";
import { HeroBalance } from "@/components";

export interface HomeProps {
  avatarInitials?: string;
  greeting?: string;
  userName?: string;
  totalBalance?: string;
  incomeLabel?: string;
  incomeValue?: string;
  expenseLabel?: string;
  expenseValue?: string;
  activeDot?: number;
  recentTitle?: string;
  recentViewAll?: string;
  transactions?: Transaction[];
  spendingTitle?: string;
  spendingTotal?: string;
  spendingCategories?: SpendingCategory[];
  goalsTitle?: string;
  goals?: GoalCardSimple[];
  cuotasTitle?: string;
  cuotasViewAll?: string;
  cuotas?: CuotaItem[];
  navItems?: NavItem[];
  onNavItemClick?: (index: number) => void;
  onMenuClick?: () => void;
  onSeeAllTransactions?: () => void;
  onSeeAllCuotas?: () => void;
}

export function Home({
  avatarInitials = "JS",
  greeting = "Good morning",
  userName = "John",
  totalBalance = "$24,563",
  incomeLabel = "Income",
  incomeValue = "$8,420",
  expenseLabel = "Expenses",
  expenseValue = "$3,842",
  activeDot = 0,
  recentTitle = "Recent",
  recentViewAll = "See all",
  transactions = [
    { icon: "briefcase", iconBg: "bg-green-600", name: "Salary", date: "Feb 1, 2024", amount: "+$5,200", amountColor: "text-[#058743]" },
    { icon: "shopping-bag", iconBg: "bg-orange-600", name: "Amazon", date: "Feb 2, 2024", amount: "-$156" },
    { icon: "fork-knife", iconBg: "bg-red-600", name: "Restaurant", date: "Feb 3, 2024", amount: "-$89" },
  ],
  spendingTitle = "Spending",
  spendingTotal = "$3,842",
  spendingCategories = [
    { label: "Food", percentage: 28, color: "bg-red-600" },
    { label: "Transport", percentage: 23, color: "bg-blue-600" },
    { label: "Shopping", percentage: 19, color: "bg-orange-600" },
    { label: "Other", percentage: 30, color: "bg-[#71717A]" },
  ],
  goalsTitle = "Goals",
  goals = [
    { icon: "airplane", name: "Vacation", progress: "48%", highlighted: true },
    { icon: "car", name: "New Car", progress: "34%" },
    { icon: "shield", name: "Emergency", progress: "92%" },
  ],
  cuotasTitle = "Planes de Cuotas",
  cuotasViewAll = "Ver todos",
  cuotas = [
    { name: "iPhone 15 Pro", progressLabel: "3/6 cuotas", amount: "$199" },
    { name: "MacBook Air M3", progressLabel: "8/12 cuotas", amount: "$125" },
    { name: "Seguro Auto", progressLabel: "2/4 cuotas", amount: "$89" },
  ],
  navItems = [
    { icon: "house", label: "Home", active: true },
    { icon: "wallet", label: "Budgets" },
    { icon: "chart-bar", label: "Statistics" },
    { icon: "trend-up", label: "Inversiones" },
    { icon: "dots-three", label: "Más" },
  ],
  onNavItemClick,
  onMenuClick,
  onSeeAllTransactions,
  onSeeAllCuotas,
}: HomeProps) {
  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar initials={avatarInitials} size="w-[44px] h-[44px]" />
          <div className="flex flex-col">
            <span className="text-[13px] font-normal text-[#71717A]">{greeting}</span>
            <span className="text-lg font-bold text-black font-['Outfit']">{userName}</span>
          </div>
        </div>
        <button type="button" onClick={onMenuClick} aria-label="Menu">
          <IconBadge
            icon="list"
            bg="bg-[#F4F4F5]"
            iconColor="text-black"
            size="w-[44px] h-[44px]"
            rounded="rounded-full"
          />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-8 px-5 pb-5">
          <HeroBalance
            balance={totalBalance}
            incomeLabel={incomeLabel}
            incomeValue={incomeValue}
            expenseLabel={expenseLabel}
            expenseValue={expenseValue}
            activeDot={activeDot}
          />

          <CardSection
            title={recentTitle}
            titleClassName="text-2xl font-extrabold text-black font-['Outfit']"
            action={
              <button type="button" onClick={onSeeAllTransactions} className="text-sm font-medium text-[#71717A]">
                {recentViewAll}
              </button>
            }
          >
            {transactions.map((tx, i) => (
              <ListItemRow
                key={tx.name}
                left={<IconBadge icon={tx.icon} bg={tx.iconBg} />}
                title={tx.name}
                subtitle={tx.date}
                titleClassName="text-base font-semibold text-black font-['Outfit']"
                subtitleClassName="text-xs font-normal text-[#A1A1AA]"
                right={
                  <span className={`text-base font-bold font-['Outfit'] ${tx.amountColor ?? "text-black"}`}>
                    {tx.amount}
                  </span>
                }
                showBorder={i < transactions.length - 1}
                padding="py-4"
              />
            ))}
          </CardSection>

          <CardSection
            title={spendingTitle}
            titleClassName="text-2xl font-extrabold text-black font-['Outfit']"
            action={
              <span className="text-xl font-light text-[#71717A] font-['Outfit']">{spendingTotal}</span>
            }
          >
            {spendingCategories.map((cat) => (
              <SpendingBar
                key={cat.label}
                label={cat.label}
                percentage={cat.percentage}
                barColor={cat.color}
              />
            ))}
          </CardSection>

          <CardSection
            title={goalsTitle}
            titleClassName="text-2xl font-extrabold text-black font-['Outfit']"
          >
            <div className="flex gap-3 overflow-x-auto">
              {goals.map((goal) => (
                <div
                  key={goal.name}
                  className={`flex flex-col gap-3 rounded-[20px] p-4 min-w-[140px] ${
                    goal.highlighted ? "bg-black" : "bg-[#F4F4F5]"
                  }`}
                >
                  <PhosphorIcon
                    name={goal.icon}
                    size="text-2xl"
                    className={goal.highlighted ? "text-white" : "text-black"}
                  />
                  <div className="flex flex-col gap-1">
                    <span className={`text-base font-bold font-['Outfit'] ${goal.highlighted ? "text-white" : "text-black"}`}>
                      {goal.name}
                    </span>
                    <span className={`text-2xl font-light font-['Outfit'] ${goal.highlighted ? "text-[#A1A1AA]" : "text-[#71717A]"}`}>
                      {goal.progress}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardSection>

          <CardSection
            title={cuotasTitle}
            titleClassName="text-2xl font-extrabold text-black font-['Outfit']"
            action={
              <button type="button" onClick={onSeeAllCuotas} className="text-sm font-medium text-[#71717A]">
                {cuotasViewAll}
              </button>
            }
          >
            {cuotas.map((cuota) => (
              <ListItemRow
                key={cuota.name}
                left={<></>}
                title={cuota.name}
                subtitle={cuota.progressLabel}
                titleClassName="text-base font-semibold text-black font-['Outfit']"
                subtitleClassName="text-[13px] font-medium text-[#71717A]"
                right={
                  <span className="text-xl font-bold text-black font-['Outfit']">{cuota.amount}</span>
                }
                padding="p-4"
                className="bg-[#F4F4F5] rounded-2xl"
                gap="gap-0"
              />
            ))}
          </CardSection>
        </div>
      </div>

      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />
    </div>
  );
}
