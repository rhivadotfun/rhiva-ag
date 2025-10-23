"use client";

import clsx from "clsx";
import Link from "next/link";
import Image from "next/image";
import debounce from "lodash.debounce";
import { useMemo, useState } from "react";
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
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = useMemo(() => debounce(setExpanded, 150), []);

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
      aria-hidden="true"
      className={clsx(
        props.className,
        expanded ? "xl:w-xs" : "xl:w-[96px]",
        "transition-all duration-300 flex flex-col bg-dark-secondary lt-sm:border lt-md:border-b-none lt-sm:border-primary/25 lt-sm:rounded-t-2xl sm:space-y-4",
      )}
      onMouseLeave={() => toggleExpanded(false)}
    >
      <div className={clsx("py-4 lt-sm:hidden xl:h-14", expanded && "xl:px-4")}>
        <Image
          src={Logo}
          width={189}
          height={61}
          alt="Rhiva"
          className={clsx("w-40 h-12 lt-xl:hidden", !expanded && "xl:hidden")}
        />
        <Image
          src={LogoSmall}
          width={20}
          height={20}
          alt="Rhiva"
          className={clsx("lt-xl:hidden m-auto", expanded && "xl:hidden")}
        />
      </div>

      <nav className={clsx(props.className, "flex-1 flex sm:flex-col")}>
        <ul className="flex-1 flex sm:flex-col sm:space-y-4 sm:p-4">
          {navItems.map((navItem) => {
            const [path] = pathname.split(/\//g).filter(Boolean);
            const selected =
              navItem.path === pathname || navItem.path.includes(path);
            const Button = Link;

            return (
              <li
                key={navItem.name}
                className="lt-sm:flex-1"
              >
                <Button
                  href={navItem.path}
                  className={clsx(
                    "flex items-center p-4 lt-md:flex-col lt-md:space-y-2 sm:space-x-4 sm:p-4",
                    selected
                      ? "text-primary fill-primary"
                      : "text-white/70 fill-white/70",
                  )}
                  onMouseEnter={() => toggleExpanded(true)}
                  onNavigate={(event) => {
                    if (navItem.protected) {
                      if (authenticated) return;
                      event.preventDefault();
                      return signIn();
                    }
                  }}
                >
                  <navItem.icon className="size-6 lt-sm:size-8" />
                  <span
                    className={clsx(
                      expanded ? "lt-xl:hidden" : "lt-xl:hidden xl:hidden",
                    )}
                  >
                    {navItem.name}
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
        <SideNav
          expanded={expanded}
          setExpanded={toggleExpanded}
          className="lt-sm:hidden"
        />
      </nav>
    </div>
  );
}
