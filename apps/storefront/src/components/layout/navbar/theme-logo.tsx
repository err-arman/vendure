import Image from "next/image";

export function ThemeLogo() {
  return (
    <Image
      src="/ecbr-logo.png"
      alt="East Bengal Coffee Roasters"
      width={88}
      height={100}
      className="h-12 w-auto"
    />
  );
}