import { MdAdd } from "react-icons/md";
import { FiMinus } from "react-icons/fi";

type NumberProps = {
  label: string;
} & React.ComponentProps<"div">;

export default function NumberInput({ label }: NumberProps) {
  return (
    <div className="flex flex-col space-y-2">
      <p className="text-light-secondary">{label}</p>
      <div className="flex items-center px-2 border border-white/20 rounded-md">
        <button
          type="button"
          className="size-6 flex items-center justify-center bg-white/50 text-black rounded"
        >
          <MdAdd size={24} />
        </button>
        <input
          placeholder="0"
          className="w-full p-2 text-center"
        />
        <button
          type="button"
          className="size-6 flex items-center justify-center bg-white/50 text-black rounded"
        >
          <FiMinus size={24} />
        </button>
      </div>
    </div>
  );
}
