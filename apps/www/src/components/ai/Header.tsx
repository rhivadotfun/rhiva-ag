"use client";
import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { MdMenu } from "react-icons/md";

import AiIcon from "@/assets/ai.png";
import SideNav from "../layout/SideNav";
import LogoSmall from "@/assets/logo-sm.png";

type HeaderProps = {
  canBack?: boolean;
  title?: string;
} & React.ComponentProps<"header">;

export default function Header({ canBack, title, ...props }: HeaderProps) {
  const [showSideNav, setShowSideNav] = useState(false);

  return (
    <>
      <header
        {...props}
        className={clsx(
          "flex items-center p-4 lt-sm:border-b lt-sm:border-transparent lt-sm:[border-image:linear-gradient(to_right,#000,theme(colors.primary),#000)_1]",
          props.className,
        )}
      >
        <div className="flex items-center space-x-4">
          <Image
            src={LogoSmall}
            width={20}
            height={20}
            alt="Rhiva"
            className="sm:hidden m-auto"
          />
          <button
            type="button"
            className="sm:hidden"
            onClick={() => setShowSideNav(true)}
          >
            <MdMenu
              color="white"
              className="text-xl"
            />
          </button>
        </div>
        <div className="flex-1 flex justify-center items-center space-x-2">
          <Image
            src={AiIcon}
            width={32}
            height={32}
            alt="Rhiva AI"
          />
          <div className="text-center">
            <p>AI Assistant</p>
            <p className="text-gray text-xs">Always here to help</p>
          </div>
        </div>
      </header>
      {showSideNav && (
        <SideNav
          className="sm:hidden"
          onClose={() => setShowSideNav(false)}
        />
      )}
    </>
  );
}
