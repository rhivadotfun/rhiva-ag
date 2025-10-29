import clsx from "clsx";
import { useMemo } from "react";
import debounce from "lodash.debounce";
import { MdSearch } from "react-icons/md";

type SearchInputProps = {
  defaultValue?: string;
  placeholder?: string;
  onChange: (value?: string | null) => void;
} & Omit<React.ComponentProps<"div">, "onChange">;

export default function SearchInput({
  defaultValue,
  placeholder,
  onChange,
  ...props
}: SearchInputProps) {
  const search = useMemo(() => debounce(onChange, 500), [onChange]);

  return (
    <div
      {...props}
      className={clsx(
        "flex flex-nowrap items-center border border-white/10 backdrop-blur px-2 rounded-md group focus-within:border-primary",
        props.className,
      )}
    >
      <MdSearch
        size={24}
        className="text-gray group-focus-within:fill-primary"
      />
      <input
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="flex-1 shrink-0 bg-transparent p-2 outline-none placeholder-text-gray"
        onChange={(event) => {
          const value = event.target.value;
          if (value.trim().length > 0) return search(value);
          else search(null);
        }}
      />
    </div>
  );
}
