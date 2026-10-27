export function AuthCard({
  title,
  subtitle,
  wide = false,
  children,
}: {
  title: string;
  subtitle?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 justify-center bg-gradient-to-b from-orange-50 to-amber-50/40 px-4 py-10">
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black text-zinc-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
