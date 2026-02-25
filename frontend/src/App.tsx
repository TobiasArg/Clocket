import { AppRouter } from "./router/AppRouter";
import { useRouter } from "./router/useRouter";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";

export function App() {
  const { currentPath, navigateTo } = useRouter();

  const isDesktop = currentPath === "/home-desktop";
  const shellClass = isDesktop
    ? "app-device-shell app-device-shell--framed w-full max-w-[1280px] h-[860px] rounded-[28px] overflow-hidden"
    : "app-device-shell w-full h-screen h-dvh overflow-hidden";
  const rootClass = isDesktop
    ? "app-root-shell w-full min-h-dvh md:w-screen md:flex md:flex-col md:items-center md:justify-start md:px-3 md:py-4"
    : "app-root-shell w-full h-screen h-dvh overflow-hidden";

  return (
    <ErrorBoundary>
      <div className={rootClass}>
        <div className={shellClass}>
          <div className="app-router-host">
            <AppRouter currentPath={currentPath} navigateTo={navigateTo} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
