export default function RatioInput() {
  const autoFillOptions = [
    { label: "50:50", value: "1/2" },
    { label: "75:25", value: "1/3" },
    { label: "40:60", value: "2/4" },
  ];

  return (
    <div className="flex flex-col">
      <p>Liquidity Ratio %</p>
      <input
        type="range"
        className="accent-primary"
      />
      <div className="flex justify-between">
        <p>50% SOL</p>
        <p>50% USDC</p>
      </div>
      <div className="flex items-center justify-between space-x-8">
        <div className="flex items-center space-x-2">
          {autoFillOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className="px-1 py-1 border border-white/10 text-xs text-light rounded"
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex border border-white/10 p-2 rounded-md focus-within:border-primary">
          <input
            placeholder="50:50"
            className="w-full placeholder-text-gray"
          />
          <span className="text-nowrap text-xs text-gray">Custom Ratio</span>
        </div>
      </div>
    </div>
  );
}
