import { AppRouter } from "./router/AppRouter";
import { useRouter } from "./router/useRouter";

export function App() {
  const { currentPath, navigateTo } = useRouter();

  const isDesktop = currentPath === "/home-desktop";
  const shellClass = isDesktop
    ? "w-full max-w-[1280px] h-[860px] bg-white rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden"
    : "w-full max-w-[430px] h-[860px] bg-white rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden";

  return (
    <div className="min-h-screen w-screen bg-[#E4E4E7] flex flex-col items-center justify-start py-4 px-3">
      <div className={shellClass}>
        <AppRouter currentPath={currentPath} navigateTo={navigateTo} />
      </div>
    </div>
  );
}
