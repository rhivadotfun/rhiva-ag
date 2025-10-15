import clsx from "clsx";
import { Field } from "formik";
import { IoChevronDown } from "react-icons/io5";

type TokenInputProps = {
  label?: string;
  name: string;
} & React.ComponentProps<"div">;

export default function TokenInput({ label, name, ...props }: TokenInputProps) {
  return (
    <div
      {...props}
      className={clsx(
        "flex flex-col space-y-2 bg-primary/5 border border-primary/10 backdrop-blur-3xl rounded-md p-4 focus-within:border-primary",
        props.className,
      )}
    >
      <div className="flex items-center">
        <p className="text-gray">{label}</p>
        <div></div>
      </div>
      <div className="flex items-center space-x-4">
        <button
          type="button"
          className="flex items-center space-x-2 bg-primary/10 px-2 py-2 rounded-md"
        >
          <p className="font-medium">USDT</p>
          <IoChevronDown />
        </button>
        <Field
          name={name}
          placeholder="0"
          className="w-full bg-transparent text-2xl text-end font-medium border-none"
        />
      </div>
      <p className="text-gray text-xs">Balance: 0</p>
    </div>
  );
}
