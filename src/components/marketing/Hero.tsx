interface HeroProps {
  title: string;
  subtitle?: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  eyebrow?: string;
  align?: "left" | "center";
}

export default function Hero({
  title,
  subtitle,
  cta,
  secondaryCta,
  eyebrow,
  align = "center"
}: HeroProps) {
  return (
    <section className={`py-12 md:py-20 lg:py-24 ${align === "center" ? "text-center" : "text-left"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {eyebrow && (
          <p className="text-sm font-semibold text-blue-600 mb-4 uppercase tracking-wide">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {subtitle}
          </p>
        )}
        {(cta || secondaryCta) && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {cta && (
              <a
                href={cta.href}
                className="tap-lg w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors"
              >
                {cta.label}
              </a>
            )}
            {secondaryCta && (
              <a
                href={secondaryCta.href}
                className="tap-lg w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                {secondaryCta.label}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
