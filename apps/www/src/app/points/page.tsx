"use client";
import { useTiers } from "@/hooks/useTiers";
import Header from "@/components/layout/Header";
import PointTier from "@/components/points/PointTier";
import PointAnalytic from "@/components/points/PointAnalytic";
import PointOverview from "@/components/points/PointOverview";

export default function PointPage() {
  const { tiers, nextTier, currentTier, user, stars } = useTiers();
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
        <div className="flex flex-col space-y-8">
          <PointOverview
            xp={user.xp}
            currentTier={currentTier}
            nextTier={nextTier}
          />
          <PointAnalytic
            totalUsers={user.totalUsers}
            stars={stars}
            rank={user.rank}
            xp={user.xp}
            todayXp={user.todayXp}
          />
          <PointTier
            tiers={tiers}
            currentTier={currentTier}
          />
        </div>
      </div>
    </div>
  );
}
