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
import { useSignIn } from "@/hooks/useSignIn";

export default function HeaderAction(props: React.ComponentProps<"div">) {
  const signIn = useSignIn();
  const { user, setUser } = useAuth();
  const { authStatus, signOut } = useUser();

  const isAuthenticated = useMemo(
    () => authStatus === AuthStatus.AUTHENTICATED && user,
    [user, authStatus],
  );

  const onSignOut = useCallback(
    () => signOut().then(() => setUser(undefined)),
    [signOut, setUser],
  );
  return (
    <div
      {...props}
      className={clsx("flex items-center space-x-2", props.className)}
    >
      {isAuthenticated && user ? (
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
          onClick={signIn}
        >
          Login
        </button>
      )}
    </div>
  );
}
