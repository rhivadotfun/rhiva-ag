import { Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import clsx from "clsx";
import type { PositionData } from "@meteora-ag/dlmm";

export interface ActionItem {
  id: string;
  label: string;
  action: () => void;
  variant?: "default" | "danger";
}

export interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actions?: ActionItem[];
  positionData?: PositionData;
  positionType: "open" | "closed";
}

export default function ActionModal({
  isOpen,
  onClose,
  positionType,
  positionData,
  actions: customActions,
}: ActionModalProps) {
  const getDefaultActions = (): ActionItem[] => {
    if (positionType === "open") {
      return [
        {
          id: "details",
          label: "Details",
          action: () => {
            console.log("Details clicked for position:", positionData);
            onClose();
          },
        },
        {
          id: "generate-pnl",
          label: "Generate PNL card",
          action: () => {
            console.log(
              "Generate PNL card clicked for position:",
              positionData,
            );
            onClose();
          },
        },
        {
          id: "claim-reward",
          label: "Claim reward",
          action: () => {
            console.log("Claim reward clicked for position:", positionData);
            onClose();
          },
        },
        {
          id: "close-position",
          label: "Close position",
          action: () => {
            console.log("Close position clicked for position:", positionData);
            onClose();
          },
          variant: "danger",
        },
      ];
    } else {
      return [
        {
          id: "generate-pnl",
          label: "Generate PNL card",
          action: () => {
            console.log(
              "Generate PNL card clicked for position:",
              positionData,
            );
            onClose();
          },
        },
      ];
    }
  };

  const actions = customActions || getDefaultActions();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <Transition
      appear
      show={isOpen}
      as={Fragment}
    >
      <Dialog
        as="div"
        className="relative z-50"
        onClose={onClose}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/60"
            aria-hidden="true"
          />
        </Transition.Child>

        {/* Full-screen container to center the modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
            {/* Modal panel */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-[#0f1419] border border-white/20 p-6 text-left shadow-xl transition-all w-full max-w-[320px]">
                {/* Action Items */}
                <div className="flex flex-col space-y-2">
                  {actions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.action}
                      className={clsx(
                        "w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150",
                        "hover:bg-white/10 active:scale-[0.98]",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#0f1419]",
                        item.variant === "danger"
                          ? "text-red-500 hover:bg-red-500/10"
                          : "text-white",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
