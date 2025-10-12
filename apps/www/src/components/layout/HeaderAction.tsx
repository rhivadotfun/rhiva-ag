"use client";
import clsx from "clsx";
import { AuthStatus } from "@civic/auth";
import { useUser } from "@civic/auth/react";
import { useCallback, useMemo } from "react";
import IcCivicIcon from "@/assets/icons/ic_civic";
import { MdContentCopy, MdLogout, MdOutlineSend } from "react-icons/md";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

import { truncateString } from "@/lib";
import { useAuth } from "@/hooks/useAuth";
import { useTRPCClient } from "@/trpc.client";

export default function HeaderAction(props: React.ComponentProps<"div">) {
  const trpcClient = useTRPCClient();
  const { user, setUser } = useAuth();
  const { signIn, authStatus, signOut } = useUser();

  const isAuthenticated = useMemo(
    () => authStatus === AuthStatus.AUTHENTICATED,
    [authStatus],
  );

  const onSignOut = useCallback(
    () => signOut().then(() => setUser(undefined)),
    [signOut, setUser],
  );
  const onSignIn = useCallback(
    async () =>
      signIn().then(() => {
        return trpcClient.user.me.query().then(setUser);
      }),
    [signIn, trpcClient, setUser],
  );

  return (
    <div
      {...props}
      className={clsx("flex items-center space-x-2", props.className)}
    >
      {isAuthenticated ? (
        <>
          <button
            type="button"
            className="border border-primary/50 text-light px-2 py-1 rounded-md"
          >
            {user.xp} XP
          </button>
          <Popover className="relative">
            <PopoverButton className="flex items-center space-x-2 bg-primary/10 px-2 py-1 rounded-md outline-none">
              <div className="bg-[#7C75FF] p-1 rounded-md">
                <IcCivicIcon
                  width={24}
                  height={24}
                  className="size-4"
                />
              </div>
              <span className="text-light">
                {truncateString(user.wallet.id)}
              </span>
              <MdContentCopy className="text-white/60" />
            </PopoverButton>
            <PopoverPanel className="mt-4 absolute inset-x-0 bg-dark border border-white/10 rounded-md">
              <button
                type="button"
                className="flex items-center space-x-2 p-2"
              >
                <MdOutlineSend className="-rotate-45" />
                <span>Send</span>
              </button>
              <button
                type="button"
                className="flex items-center space-x-2 p-2"
                onClick={onSignOut}
              >
                <MdLogout />
                <span>Logout</span>
              </button>
            </PopoverPanel>
          </Popover>
        </>
      ) : (
        <button
          type="button"
          className="bg-primary text-black px-4 py-1.5 rounded"
          onClick={onSignIn}
        >
          Login
        </button>
      )}
    </div>
  );
}
