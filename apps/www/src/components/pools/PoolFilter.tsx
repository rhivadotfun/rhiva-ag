import { useState } from "react";
import { MdOutlineFilterAlt } from "react-icons/md";
import PoolFilterDialog from "./PoolFilterDialog";

export default function PoolFilter(props: React.ComponentProps<"div">) {
  const [open, setOpen] = useState(false);

  return (
    <div {...props}>
      <button
        type="button"
        className="flex items-center space-x-2 bg-white/5 text-gray backdrop-blur px-4 py-2 rounded-md"
        onClick={() => setOpen(true)}
      >
        <MdOutlineFilterAlt size={18} />
        <span>Filter</span>
      </button>
      <PoolFilterDialog
        open={open}
        onClose={setOpen}
      />
    </div>
  );
}
