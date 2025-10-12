import Header from "@/components/ai/Header";
import { MdSend } from "react-icons/md";

export default function AiPage() {
  return (
    <div className="flex-1 flex flex-col overflow-y-scroll">
      <Header
        canBack
        className="sticky top-0 z-10 sm:bg-white/10 sm:backdrop-blur-3xl"
      />
      <div className="flex-1 flex flex-col overflow-y-scroll"></div>
      <div className="sticky bottom-0 flex sm:items-center sm:justify-center sm:bg-white/10">
        <div className="flex  space-x-4 p-4 z-10 sm:self-center w-full sm:max-w-7xl">
          <input
            placeholder="Ask me anything..."
            className="flex-1 p-3 border border-white/10 rounded focus:border-primary"
          />
          <button
            type="submit"
            className="aspect-square flex items-center justify-center bg-primary/20 p-2 rounded"
          >
            <MdSend size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
