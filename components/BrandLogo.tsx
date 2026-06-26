import Image from "next/image";

type BrandLogoProps = {
  width?: number;
  className?: string;
};

export default function BrandLogo({ width = 22, className = "" }: BrandLogoProps) {
  const height = Math.round((width * 40) / 47);

  return (
    <Image
      src="/brand-logo.svg"
      alt="Helix"
      width={width}
      height={height}
      className={`shrink-0 ${className}`}
      priority
    />
  );
}
