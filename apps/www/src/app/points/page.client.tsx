"use client";

import { useTiers } from "@/hooks/useTiers";
import PointTier from "@/components/points/PointTier";
import PointAnalytic from "@/components/points/PointAnalytic";
import PointOverview from "@/components/points/PointOverview";

export default function PointClientPage() {
  const { tiers, nextTier, currentTier, user, stars } = useTiers();

  return (
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
  );
}
