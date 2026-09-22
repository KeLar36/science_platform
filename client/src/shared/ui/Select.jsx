import React from "react";

export default function Select({
  label,
  options = [],
  className = "",
  error,
  id,
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 w-full text-left ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-[10px] font-mono font-bold tracking-widest text-text-muted uppercase select-none"
        >
          {label}
        </label>
      )}

      <div className="relative w-full">
        <select
          id={id}
          className={`
            w-full px-3.5 py-2 pr-10 text-xs font-mono rounded-lg border outline-none appearance-none cursor-pointer transition-all duration-200
            bg-bg-secondary text-text-primary 
            ${
              error
                ? "border-status-danger focus:ring-2 focus:ring-status-danger/20"
                : "border-border-color hover:border-text-muted focus:border-brand focus:ring-2 focus:ring-brand/20"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            bg-[url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")] 
            bg-[length:14px_14px] bg-[right:12px_center] bg-no-repeat
          `}
          {...props}
        >
          {options.map((option, index) => (
            <option
              key={option.value ?? index}
              value={option.value}
              className="bg-bg-secondary text-text-primary py-1"
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <span className="text-[10px] font-mono text-status-danger mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
}
