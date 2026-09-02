export default function ProgramSpecification({ program }) {
  const hasSpecs =
    program.amount ||
    program.issn ||
    program.impactFactor ||
    program.organizer ||
    program.location;

  if (!hasSpecs) return null;

  return (
    <div className="border-t border-b border-border-color py-4 space-y-2 font-mono text-xs bg-bg-secondary p-4 rounded-xl">
      <h5 className="text-[10px] text-text-muted uppercase font-black tracking-wider mb-2">
        // Специфікація коду моделі
      </h5>

      {program.type === "Грант" && program.amount && (
        <div>
          Обсяг фінансування (Бюджет):{" "}
          <span className="text-amber-500 font-black">{program.amount}</span>
        </div>
      )}

      {program.type === "Науковий журнал" && (
        <>
          {program.issn && (
            <div>
              Міжнародний індекс ISSN:{" "}
              <span className="text-text-primary font-bold">
                {program.issn}
              </span>
            </div>
          )}
          <div>
            Метрика Impact Factor:{" "}
            <span className="text-emerald-500 font-black">
              {program.impactFactor || "0"}
            </span>
          </div>
        </>
      )}

      {program.organizer && (
        <div>
          Головний організатор / Комітет:{" "}
          <span className="text-text-secondary">{program.organizer}</span>
        </div>
      )}
    </div>
  );
}
