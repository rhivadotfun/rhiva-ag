import PointClientPage from "./page.client";
import Header from "@/components/layout/Header";

export const dynamic = "force-dynamic";
export default function PointPage() {
  return (
    <div className="flex-1 flex flex-col backdrop-blur-2xl overflow-y-scroll lt-sm:fixed lt-sm:inset-0 lt-md:z-50 lt-sm:bg-dark">
      <Header
        canBack
        className="sticky top-0 z-10 md:px-8"
      />
      <div className="flex-1 flex flex-col space-y-8 overflow-y-scroll p-4 md:px-8">
        <div>
          <p className="text-base font-bold sm:text-lg">Point System</p>
          <p className="text-xs text-white/50 sm:text-sm">
            Track your XP, level up, and climb the global ranks
          </p>
        </div>
        <PointClientPage />
      </div>
    </div>
  );
}
