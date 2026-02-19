import { AppRouter } from "./router/AppRouter";
import { useRouter } from "./router/useRouter";

export function App() {
  const { currentPath, navigateTo } = useRouter();

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-white">
      <AppRouter currentPath={currentPath} navigateTo={navigateTo} />
    </div>
  );
}
