import { AppRouter } from "./router/AppRouter";
import { useRouter } from "./router/useRouter";

export function App() {
  const { currentPath, navigateTo } = useRouter();

  const isDesktop = currentPath === "/home-desktop";
  const shellClass = isDesktop
    ? "app-device-shell w-full max-w-[1280px] h-[860px] rounded-[28px] overflow-hidden"
    : "app-device-shell w-full h-dvh overflow-hidden md:max-w-[430px] md:h-[860px] md:rounded-[28px]";

  return (
    <div className="app-root-shell w-full min-h-dvh md:w-screen md:flex md:flex-col md:items-center md:justify-start md:px-3 md:py-4">
      <div className={shellClass}>
        <AppRouter currentPath={currentPath} navigateTo={navigateTo} />
      </div>
    </div>
  );
}
