"use client";
import clsx from "clsx";
import { useState } from "react";
import type z from "zod";
import { FiEdit3, FiMenu, FiMessageSquare } from "react-icons/fi";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import type { threadSelectSchema } from "@rhiva-ag/datasource";

type ChatSidebarProps = {
  threads: z.infer<typeof threadSelectSchema>[];
  activeThread?: z.infer<typeof threadSelectSchema>;
  onThreadSelect: (thread: z.infer<typeof threadSelectSchema>) => void;
  onNewChat: () => void;
} & React.ComponentProps<"aside">;

export default function ChatSidebar({
  threads,
  activeThread,
  onThreadSelect,
  onNewChat,
  ...props
}: ChatSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  // Helper to get thread title - use summary or first message if available
  const getThreadTitle = (thread: z.infer<typeof threadSelectSchema>) => {
    // Check if thread has a summary or title field
    if ("summary" in thread && thread.summary) {
      return thread.summary as string;
    }
    if ("title" in thread && thread.title) {
      return thread.title as string;
    }
    // Fallback to date-based title
    const date = new Date(thread.createdAt);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return `Chat at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return `Chat from ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
  };

  return (
    <aside
      {...props}
      className={clsx(
        "flex flex-col bg-dark-secondary border-r border-white/10 transition-all duration-300 ease-in-out h-full",
        isCollapsed ? "w-20" : "w-64",
        props.className,
      )}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <FiMenu
              size={20}
              className="text-white/70"
            />
          </div>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors ml-auto"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <MdChevronRight
              size={20}
              className="text-white/70"
            />
          ) : (
            <MdChevronLeft
              size={20}
              className="text-white/70"
            />
          )}
        </button>
      </div>

      {/* New Chat Button */}
      {!isCollapsed && (
        <button
          type="button"
          onClick={onNewChat}
          className="flex items-center space-x-3 mx-4 mb-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
        >
          <FiEdit3
            size={18}
            className="flex-shrink-0 text-white"
          />
          <span className="font-medium text-white">New chat</span>
        </button>
      )}

      {/* Chat History Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isCollapsed && (
          <div className="px-4 py-3 border-t border-white/10">
            <h3 className="text-xs text-white/50 uppercase tracking-wider font-medium">
              Chat history
            </h3>
          </div>
        )}

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {threads.length === 0 ? (
            <div className="px-4 py-8 text-center">
              {!isCollapsed && (
                <p className="text-sm text-white/50">No chat history yet</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col space-y-0.5">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => onThreadSelect(thread)}
                  className={clsx(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-left group",
                    activeThread?.id === thread.id
                      ? "bg-white/10 text-white"
                      : "hover:bg-white/5 text-white/70 hover:text-white",
                    isCollapsed && "justify-center px-2",
                  )}
                  title={isCollapsed ? getThreadTitle(thread) : undefined}
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
                  {!isCollapsed && (
                    <span className="flex-1 text-sm truncate leading-tight">
                      {getThreadTitle(thread)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
