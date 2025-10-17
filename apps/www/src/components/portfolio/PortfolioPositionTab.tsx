import { TabPanel } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC, useTRPCClient } from "@/trpc.client";

export default function PortfolioPositionTab() {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const { data } = useQuery({
    queryKey: trpc.position.list.queryKey(),
    queryFn: () => trpcClient.position.list.query(),
  });

  return (
    <TabPanel>
      <table></table>
    </TabPanel>
  );
}
