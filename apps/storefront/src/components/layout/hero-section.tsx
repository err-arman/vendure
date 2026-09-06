export async function HeroSection() {
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

      {/* Logo medallion */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
        <div className="flex items-center justify-center">
          <div className="relative w-64 h-64 md:w-72 md:h-72 lg:w-[470px] lg:h-[470px]">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/80 to-indigo-900/80 rounded-full border-indigo-500 shadow-2xl flex flex-col items-center justify-center">
              <img
                src="/ecbr-logo.png"
                alt="East Bengal Coffee Roasters"
                className="w-40 h-auto lg:w-80 lg:h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}