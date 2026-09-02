"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeLogo() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const src =
    mounted && resolvedTheme === "dark"
      ? "/butterfly.png"
      : "/butterfly-with-text-blue.png";

  return (
    <Image
      src={src}
      alt="East Bengal Coffee Roasters"
      width={80}
      height={60}
      className="h-12 w-auto"
    />
  );
}
