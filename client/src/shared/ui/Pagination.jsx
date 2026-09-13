import { ChevronLeft, ChevronRight } from "lucide-react";

// Допоміжна функція для формування діапазону сторінок з трьома крапками (...)
function generatePaginationRange(currentPage, totalPages, siblingCount = 1) {
  // Якщо сторінок мало, показуємо їх усі без крапок
  const totalPageNumbers = siblingCount + 5;
  if (totalPageNumbers >= totalPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

  const FIRST_PAGE = 1;
  const LAST_PAGE = totalPages;

  // Випадок 1: Крапки тільки праворуч (наприклад: 1 2 3 4 5 ... 125)
  if (!shouldShowLeftDots && shouldShowRightDots) {
    let leftItemCount = 3 + 2 * siblingCount;
    let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, "...", LAST_PAGE];
  }

  // Випадок 2: Крапки тільки ліворуч (наприклад: 1 ... 121 122 123 124 125)
  if (shouldShowLeftDots && !shouldShowRightDots) {
    let rightItemCount = 3 + 2 * siblingCount;
    let rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1,
    );
    return [FIRST_PAGE, "...", ...rightRange];
  }

  // Випадок 3: Крапки з двох боків (наприклад: 1 ... 5 6 7 ... 125)
  if (shouldShowLeftDots && shouldShowRightDots) {
    let middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i,
    );
    return [FIRST_PAGE, "...", ...middleRange, "...", LAST_PAGE];
  }
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Отримуємо масив сторінок з крапками, наприклад: [1, 2, 3, '...', 125] або [1, '...', 5, 6, 7, '...', 125]
  const pages = generatePaginationRange(currentPage, totalPages);

  return (
    <nav className="flex items-center justify-center space-x-2 border-t border-border-color pt-6 mt-4">
      {/* Кнопка "Назад" */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1.5 rounded-md border border-border-color bg-bg-secondary text-text-primary hover:border-brand hover:text-brand disabled:opacity-30 disabled:hover:border-border-color disabled:hover:text-text-primary transition-colors cursor-pointer disabled:cursor-not-allowed"
        aria-label="Попередня сторінка"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Рендер кнопок сторінок та крапок */}
      {pages.map((p, idx) => {
        // Якщо елемент масиву — це крапки "..."
        if (p === "...") {
          return (
            <span
              key={`dots-${idx}`}
              className="px-2 py-1 text-xs font-mono text-text-secondary select-none"
            >
              &#8230;
            </span>
          );
        }

        // Рендер звичайної кнопки сторінки
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-md border transition-all cursor-pointer ${
              currentPage === p
                ? "bg-brand border-brand text-white shadow-sm"
                : "bg-bg-secondary border-border-color text-text-secondary hover:border-brand hover:text-brand"
            }`}
          >
            {p}
          </button>
        );
      })}

      {/* Кнопка "Вперед" */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-1.5 rounded-md border border-border-color bg-bg-secondary text-text-primary hover:border-brand hover:text-brand disabled:opacity-30 disabled:hover:border-border-color disabled:hover:text-text-primary transition-colors cursor-pointer disabled:cursor-not-allowed"
        aria-label="Наступна сторінка"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
