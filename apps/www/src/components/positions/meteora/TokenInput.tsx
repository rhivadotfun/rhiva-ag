export default function TokenInput() {
  const autoFillOptions = [
    { label: "25%", value: 0.25 },
    { label: "50%", value: 0.5 },
    { label: "75%", value: 0.75 },
    { label: "Max", value: 1 },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between bg-black/10 border border-white/20 p-2 rounded-md focus-within:border-primary">
        <input
          name="amount"
          type="number"
          placeholder="0.0"
          className="flex-1 text-xl font-medium"
        />
        <span className="text-gray">SOL</span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray">
        <p>Balance: 0 SOL</p>
        <div className="flex items-center space-x-2">
          {autoFillOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="p-2 last:bg-primary/5 last:py-1 last:rounded"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
