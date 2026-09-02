import { useState, useEffect } from "react";

const WORDS = [
  "SCIENCE_PLATFORM_2026",
  "OPEN_ACADEMIC_HUB",
  "RESEARCH_&_INNOVATION",
  "METHODOLOGY_DATA",
];

export default function BlogHero() {
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const activeWord = WORDS[currentWordIdx];

    const handleType = () => {
      if (!isDeleting) {
        setCurrentText(activeWord.substring(0, currentText.length + 1));
        setTypingSpeed(100);

        if (currentText === activeWord) {
          setTypingSpeed(2000);
          setIsDeleting(true);
        }
      } else {
        setCurrentText(activeWord.substring(0, currentText.length - 1));
        setTypingSpeed(50);
        if (currentText === "") {
          setIsDeleting(false);
          setCurrentWordIdx((prev) => (prev + 1) % WORDS.length);
        }
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentWordIdx, typingSpeed]);

  return (
    <div className="w-full text-left space-y-3 py-6 relative overflow-hidden select-none">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
        <p className="text-[10px] font-mono font-bold text-brand uppercase tracking-[0.2em]">
          Офіційне джерело новин платформи
        </p>
      </div>

      <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-primary uppercase leading-none">
        Новини та{" "}
        <span className="block md:inline font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand to-purple-400 min-h-[40px]">
          {currentText}
          <span className="inline-block w-[3px] h-[28px] md:h-[34px] ml-1 bg-brand animate-[ping_1s_infinite] align-middle" />
        </span>
      </h1>

      <p className="text-xs text-text-secondary max-w-xl leading-relaxed tracking-wide">
        Простір публікацій, методологічних порад та актуальних наукових
        інтерв'ю. Дізнавайтеся про гранти, конференції та технологічні оновлення
        екосистеми першими.
      </p>
    </div>
  );
}
