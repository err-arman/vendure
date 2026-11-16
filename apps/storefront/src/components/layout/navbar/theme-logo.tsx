import Image from "next/image";

export function ThemeLogo() {
  return (
    <Image
      src="/the-coffee-store-logo.png"
      alt="The Coffee Store"
      width={966}
      height={266}
      className="h-10 w-auto sm:h-12"
    />
  );
}
