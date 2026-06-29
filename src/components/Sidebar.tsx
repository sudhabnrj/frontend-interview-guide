import React from 'react';

interface SidebarProps {
  activeCategory: string;
  categoryCounts: Record<string, number>;
  onCategoryClick: (category: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeCategory,
  categoryCounts,
  onCategoryClick,
  onExpandAll,
  onCollapseAll,
}) => {
  const categoriesList = [
    { name: 'AI', cleanKey: 'ai', icon: 'fas fa-brain' },
    { name: 'UI / UX', cleanKey: 'uiux', icon: 'fas fa-pen-nib' },
    { name: 'React JS', cleanKey: 'react', icon: 'fab fa-react', matchKey: 'React' },
    { name: 'JavaScript', cleanKey: 'javascript', icon: 'fab fa-js' },
    { name: 'Next.js', cleanKey: 'nextjs', icon: 'fas fa-square' },
  ];

  return (
    <aside className="col-md-4 col-xl-4 hidden md:block sidebar-column ">
      <div className="sticky top-[90px] h-[calc(100vh-120px)] overflow-y-auto p-4 bg-[rgba(255,255,255,0.7)] backdrop-blur-[10px] border border-border-custom rounded-lg shadow-sidebar transition-all duration-300">
        <h5 className="font-bold mb-3 text-uppercase text-text-muted text-[0.8rem] tracking-wider uppercase">
          Categories
        </h5>

        <nav className="flex flex-col mb-4">
          {categoriesList.map((cat) => {
            const countKey = cat.matchKey || cat.name;
            const count = categoryCounts[countKey] || 0;
            const isCategoryActive = activeCategory.toLowerCase() === (cat.matchKey || cat.name).toLowerCase().replace(/[^a-zA-Z0-9]/g, '');

            return (
              <a
                key={cat.cleanKey}
                onClick={() => onCategoryClick(countKey)}
                className={`flex items-center justify-between px-[1.2rem] py-[0.8rem] mb-2 font-medium rounded-md transition-all duration-150 cursor-pointer border border-transparent select-none no-underline ${isCategoryActive
                  ? 'bg-primary text-white font-semibold'
                  : 'text-text-secondary hover:bg-primary-light hover:text-primary'
                  }`}
                style={{ opacity: count === 0 ? 0.5 : 1 }}
              >
                <span>
                  <i className={`${cat.icon} mr-2`}></i> {cat.name}
                </span>
                <span
                  className={`text-[0.75rem] px-2.5 py-0.5 rounded-full font-semibold transition-all ${isCategoryActive
                    ? 'bg-white/20 text-white'
                    : 'bg-border-light text-text-primary border border-border-custom'
                    }`}
                >
                  {count}
                </span>
              </a>
            );
          })}
        </nav>

        <h5 className="font-bold mb-3 text-uppercase text-text-muted text-[0.8rem] tracking-wider uppercase">
          Quick Actions
        </h5>
        <div className="grid gap-2">
          <button
            onClick={onExpandAll}
            className="btn bg-primary text-white hover:bg-primary/95 text-xs font-semibold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors border-0"
          >
            <i className="fas fa-expand-arrows-alt"></i> Expand All Answers
          </button>
          <button
            onClick={onCollapseAll}
            className="btn bg-white hover:bg-border-light text-text-secondary border border-border-custom text-xs font-semibold py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors"
          >
            <i className="fas fa-compress-arrows-alt"></i> Collapse All Answers
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-border-custom text-center text-text-muted text-[0.75rem]">
          <p className="mb-1">
            <i className="fas fa-print mr-1"></i> Press <strong>Ctrl + P</strong> for print sheet.
          </p>
        </div>
      </div>
    </aside>
  );
};
