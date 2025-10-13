import clsx from "clsx";

type DepositInputProps = {} & React.ComponentProps<"div">;

export default function DepositInput(props: DepositInputProps) {
  return (
    <div
      {...props}
      className={clsx("flex flex-col space-y-4", props.className)}
    >
      <div className="flex flex-col space-y-2">
        <label
          htmlFor="amount"
          className="text-light-secondary"
        >
          Deposit Amount
        </label>
        <div className="flex flex-col space-y-2 border border-white/10 p-4 rounded-md focus-within:border-primary">
          <div className="flex items-center">
            <input
              name="amount"
              type="number"
              placeholder="0"
              className="flex-1 text-xl"
            />
            <div className="text-light">SOL</div>
          </div>
          <p className="text-sm text-gray">$0.00</p>
        </div>
      </div>
      <div className="flex justify-between">
        <div className="flex items-center space-x-2 text-light">
          <span>Estimated Yield</span>
          <div className="text-gray bg-primary/10 px-2 rounded">24H</div>
        </div>
        <p>-</p>
      </div>
    </div>
  );
}
