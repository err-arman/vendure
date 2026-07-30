import {getRouteLocale} from '@/i18n/server';

export async function HeroSection() {
    const locale = await getRouteLocale();
    return (
        <section className="relative w-full h-[57vh] lg:h-[86vh] overflow-hidden mt-16">
            {/* Background image */}
            <img
                src="/images/hero-section.jpg"
                alt="Coffee shop background"
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay for slight dimming */}
            <div className="absolute inset-0 bg-black/20" />

            {/* Curved text + circular logo */}
            <div className="relative z-10 flex flex-col items-end justify-center min-h-screen px-6">
                <div className="absolute flex items-center justify-center">
                    <div className="relative w-72 h-72 md:w-72 md:h-72 lg:w-[470px] lg:h-[470px] mr-6 md:mr-20 lg:mr-[420px] mb-96 lg:mb-60">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/80 to-indigo-900/80 rounded-full border-indigo-500 shadow-2xl flex flex-col items-center justify-center">
                            <img
                                src="/butterfly.png"
                                alt="The Coffee Store"
                                className="w-32 h-28 lg:w-48 lg:h-44 object-contain"
                            />
                        </div>

                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 300 300"
                            className="absolute inset-0 overflow-visible"
                            suppressHydrationWarning
                        >
                            {(() => {
                                const text = "THE COFFEE STORE";
                                const characters = text.split("");
                                const radius = 167;
                                const letterSpacing = 30;
                                const curveFactor = 1.0;
                                const fontSize = 38;
                                const strokeColor = "#7b4b00";
                                const strokeWidth = 4;
                                const fillColor = "#ffffff";
                                const strokeOffsetX = 2;
                                const strokeOffsetY = 2;

                                const totalAngle =
                                    (characters.length - 1) *
                                    (letterSpacing / radius) *
                                    curveFactor;
                                const startAngle = -totalAngle / 2;

                                return characters.map((char, i) => {
                                    const angle =
                                        startAngle + i * (letterSpacing / radius) * curveFactor;
                                    const x = 150 + radius * Math.sin(angle);
                                    const y = 150 - radius * Math.cos(angle);
                                    const rotate = (angle * 180) / Math.PI;

                                    return (
                                        <g
                                            key={i}
                                            transform={`translate(${x},${y}) rotate(${rotate})`}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            suppressHydrationWarning
                                        >
                                            <text
                                                x={strokeOffsetX}
                                                y={strokeOffsetY}
                                                style={{
                                                    fontFamily: "Impact, sans-serif",
                                                    fontSize,
                                                    fontWeight: "bold",
                                                    stroke: strokeColor,
                                                    strokeWidth,
                                                    fill: "none",
                                                }}
                                            >
                                                {char}
                                            </text>
                                            <text
                                                style={{
                                                    fontFamily: "Impact, sans-serif",
                                                    fontSize,
                                                    fontWeight: "bold",
                                                    fill: fillColor,
                                                }}
                                                suppressHydrationWarning
                                            >
                                                {char}
                                            </text>
                                        </g>
                                    );
                                });
                            })()}
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    );
}
