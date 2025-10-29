export default function BounceDot() {
  return (
    <div className="flex space-x-1 rounded-2xl px-3 py-2">
      <span className="w-4 h-4 bg-gray rounded-full animate-bounce-dot animate-delay-0" />
      <span className="w-4 h-4 bg-gray rounded-full animate-bounce-dot animate-delay:200" />
      <span className="w-4 h-4 bg-gray rounded-full animate-bounce-dot animate-delay:400" />
    </div>
  );
}
