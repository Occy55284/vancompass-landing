import Image from "next/image";

export default function BrowserFrame({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1018] shadow-2xl shadow-black/50">
      <div className="flex items-center gap-1.5 border-b border-white/5 bg-white/[0.03] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
      </div>
      <Image src={src} alt={alt} width={width} height={height} className="h-auto w-full" />
    </div>
  );
}
