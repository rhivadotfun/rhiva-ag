"use client";
import clsx from "clsx";
import type z from "zod";
import moment from "moment";
import { format } from "util";
import { useCallback } from "react";
import { IoExpand } from "react-icons/io5";
import { PiSidebarSimple } from "react-icons/pi";
import { FiEdit, FiMessageSquare } from "react-icons/fi";
import type { threadSelectSchema } from "@rhiva-ag/datasource";

type ChatSidebarProps = {
  isCollapsed: boolean;
  onNewChat: () => void;
  threads?: z.infer<typeof threadSelectSchema>[];
  activeThread?: z.infer<typeof threadSelectSchema>;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  onThreadSelect: (thread: z.infer<typeof threadSelectSchema>) => void;
} & React.ComponentProps<"div">;

export default function ChatSidebar({
  threads,
  activeThread,
  isCollapsed,
  setIsCollapsed,
  onThreadSelect,
  onNewChat,
  ...props
}: ChatSidebarProps) {
  const toggleSidebar = useCallback(
    () => setIsCollapsed(!isCollapsed),
    [isCollapsed, setIsCollapsed],
  );

  return (
    <div
      {...props}
      className={clsx(
        "lt-md:fixed lt-md:left-0 lt-md:inset-y-0 lt-md:z-50",
        isCollapsed && "lt-md:hidden",
      )}
    >
      <div
        aria-hidden
        className="fixed inset-0 bg-black/50 -z-10 backdrop-blur-[2px] md:hidden"
        onClick={() => setIsCollapsed(true)}
      />
      <aside
        {...props}
        className={clsx(
          "h-full flex flex-col bg-dark-secondary backdrop-blur border-r border-white/10 transition-all duration-300 ease-in-out md:bg-white/3",
          isCollapsed ? "md:w-18" : "w-64",
          props.className,
        )}
      >
        <div className="flex items-center justify-between p-4">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors lt-md:hidden"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <IoExpand
                size={18}
                className="text-white/70"
              />
            ) : (
              <PiSidebarSimple
                size={18}
                className="text-white/70"
              />
            )}
          </button>
        </div>
        {!isCollapsed && (
          <>
            <button
              type="button"
              onClick={onNewChat}
              className="flex items-center space-x-3 mx-4 mb-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
            >
              <FiEdit
                size={18}
                className="flex-shrink-0 text-white"
              />
              <span className="font-medium text-white">New chat</span>
            </button>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-t border-white/10">
                <h3 className="text-xs text-white/50 uppercase tracking-wider font-medium">
                  Chat history
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto px-2 py-2">
                {threads?.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    {!isCollapsed && (
                      <p className="text-sm text-white/50">
                        No chat history yet
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col space-y-0.5">
                    {threads?.map((thread) => (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => onThreadSelect(thread)}
                        className={clsx(
                          "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-left group",
                          activeThread?.id === thread.id
                            ? "bg-white/10 text-white"
                            : "hover:bg-white/5 text-white/70 hover:text-white",
                        )}
                      >
                        <FiMessageSquare
                          size={16}
                          className={clsx(
                            "flex-shrink-0",
                            activeThread?.id === thread.id
                              ? "text-primary"
                              : "text-white/50 group-hover:text-white/70",
                          )}
                        />
                        <span className="flex-1 text-sm truncate leading-tight">
                          {thread.name
                            ? thread.name
                            : format(
                                "Chat at %s",
                                moment(thread.createdAt).fromNow(),
                              )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
