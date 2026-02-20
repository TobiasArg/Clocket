import { AppRouter } from "./router/AppRouter";
import { useRouter } from "./router/useRouter";

export function App() {
  const { currentPath, navigateTo } = useRouter();

  const isDesktop = currentPath === "/home-desktop";
  const shellClass = isDesktop
    ? "app-device-shell w-full max-w-[1280px] h-[860px] rounded-[28px] overflow-hidden"
    : "app-device-shell w-full max-w-[430px] h-[860px] rounded-[28px] overflow-hidden";

  return (
    <div className="app-root-shell min-h-screen w-screen flex flex-col items-center justify-start px-3 py-4">
      <div className={shellClass}>
        <AppRouter currentPath={currentPath} navigateTo={navigateTo} />
      </div>
    </div>
  );
}
