interface CardGridItem {
  title: string;
  body?: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface CardGridProps {
  items: CardGridItem[];
  cols?: { base?: number; md?: number; lg?: number };
}

export default function CardGrid({ 
  items, 
  cols = { base: 1, md: 2, lg: 3 } 
}: CardGridProps) {
  const getGridCols = () => {
    const baseCol = cols.base === 1 ? "grid-cols-1" : `grid-cols-${cols.base}`;
    const mdCol = cols.md ? `md:grid-cols-${cols.md}` : "";
    const lgCol = cols.lg ? `lg:grid-cols-${cols.lg}` : "";
    return `grid ${baseCol} ${mdCol} ${lgCol} gap-6`;
  };

  return (
    <div className={getGridCols()}>
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white card-spacing rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          {item.badge && (
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full mb-3">
              {item.badge}
            </span>
          )}
          
          {item.icon && (
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              {item.icon}
            </div>
          )}
          
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
            {item.title}
          </h3>
          
          {item.body && (
            <p className="text-gray-600 leading-relaxed">
              {item.body}
            </p>
          )}
          
          {item.href && (
            <a
              href={item.href}
              className="inline-flex items-center mt-4 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Learn more →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
