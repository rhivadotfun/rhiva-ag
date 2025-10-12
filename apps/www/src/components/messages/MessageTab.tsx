import type z from "zod";
import type { notificationSelectSchema } from "@rhiva-ag/datasource";

export type MessageTabProps = {
  message: z.infer<typeof notificationSelectSchema>;
};

export default function MessageTab() {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-col space-y-4 bg-white/3 rounded p-4">
        <div className="flex flex-col space-y-2">
          <p className="text-light">
            Introducing Rhiva - The Next Era of Liquidity Provision!
          </p>
          <p className="text-white/50">
            We’re excited to launch a seamless platform where users can provide
            liquidity and earn sustainable yields. With transparent rewards, low
            fees, and robust security...
          </p>
        </div>
      </div>
      <p className="text-xs text-gray">20/16/2025</p>
    </div>
  );
}
