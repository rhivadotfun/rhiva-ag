"use client";

import clsx from "clsx";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { AuthStatus } from "@civic/auth";
import { useUser } from "@civic/auth/react";
import { usePathname } from "next/navigation";

import SideNav from "./SideNav";
import Logo from "@/assets/logo.png";
import IcAi from "@/assets/icons/ic_ai";
import IcHome from "@/assets/icons/ic_home";
import IcPool from "@/assets/icons/ic_pool";
import LogoSmall from "@/assets/logo-sm.png";
import IcPortfolio from "@/assets/icons/ic_portfolio";

type NavItem = {
  name: string;
  path: string;
  protected?: boolean;
  icon: React.ElementType;
};

export default function NavBar(props: React.ComponentProps<"div">) {
  const pathname = usePathname();
  const { signIn, authStatus } = useUser();

  const authenticated = useMemo(
    () => authStatus === AuthStatus.AUTHENTICATED,
    [authStatus],
  );

  const navItems: NavItem[] = useMemo(
    () => [
      { name: "Home", icon: IcHome, path: "/" },
      { name: "Pools", icon: IcPool, path: "/pools" },
      { name: "AI", icon: IcAi, path: "/ai", protected: true },
      {
        name: "Portfolio",
        icon: IcPortfolio,
        path: "/portfolio",
        protected: true,
      },
    ],
    [],
  );

  return (
    <div
      {...props}
      className={clsx(
        props.className,
        "flex flex-col  bg-dark-secondary lt-sm:border lt-md:border-b-none lt-sm:border-primary/25 lt-sm:rounded-t-2xl sm:space-y-4",
      )}
    >
      <div className="py-4 lt-sm:hidden">
        <Image
          src={Logo}
          width={189}
          height={61}
          alt="Rhiva"
          className="hidden"
        />
        <Image
          src={LogoSmall}
          width={20}
          height={20}
          alt="Rhiva"
          className="lt-sm:hidden m-auto"
        />
      </div>

      <nav className={clsx(props.className, "flex-1 flex sm:flex-col")}>
        <ul className="flex-1 flex sm:flex-col sm:space-y-4 sm:p-4">
          {navItems.map((navItem) => {
            const selected = navItem.path === pathname;
            const Button = Link;

            return (
              <li
                key={navItem.name}
                className="lt-sm:flex-1"
              >
                <Button
                  href={navItem.path}
                  className={clsx(
                    "flex items-center p-2 lt-md:flex-col lt-md:space-y-2 sm:space-x-4 sm:py-4",
                    selected
                      ? "text-primary fill-primary"
                      : "text-white/70 fill-white/70",
                  )}
                  onNavigate={(event) => {
                    if (navItem.protected) {
                      if (authenticated) return;
                      event.preventDefault();
                      return signIn();
                    }
                  }}
                >
                  <navItem.icon className="size-6" />
                  <span className="sm:hidden">{navItem.name}</span>
                </Button>
              </li>
            );
          })}
        </ul>
        <SideNav className="lt-sm:hidden" />
      </nav>
    </div>
  );
}
