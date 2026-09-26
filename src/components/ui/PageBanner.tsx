import Image from "next/image";
import Link from "next/link";

/** Full-width designed banner image used at the top of app pages. */
export default function PageBanner({ src, alt, width, height, href, external, className = "" }: { src: string; alt: string; width: number; height: number; href?: string; external?: boolean; className?: string }) {
  const img = <Image src={src} alt={alt} width={width} height={height} priority className="w-full h-auto block" sizes="(max-width: 720px) 100vw, 720px" />;
  const cls = `block w-full overflow-hidden rounded-md shadow-[0_6px_18px_rgba(11,61,145,0.12)] ${className}`;
  if (!href) return <div className={cls}>{img}</div>;
  if (external || href.startsWith("tel:") || href.startsWith("http")) return <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={cls}>{img}</a>;
  return <Link href={href} className={cls}>{img}</Link>;
}
