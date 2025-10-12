import clsx from "clsx";
import { MdSearch } from "react-icons/md";

type SearchInputProps = { placeholder?: string } & React.ComponentProps<"div">;

export default function SearchInput({
  placeholder,
  ...props
}: SearchInputProps) {
  return (
    <div
      {...props}
      className={clsx(
        "flex flex-nowrap items-center border border-white/10 px-2 rounded-md group focus-within:border-primary",
        props.className,
      )}
    >
      <MdSearch
        size={24}
        className="text-gray group-focus-within:fill-primary"
      />
      <input
        type="search"
        placeholder={placeholder}
        className="flex-1 shrink-0 bg-transparent p-2 outline-none placeholder-text-gray"
      />
    </div>
  );
}
