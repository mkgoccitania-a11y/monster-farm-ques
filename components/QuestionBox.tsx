import { MultiplicationQuestion } from "@/lib/types";

interface QuestionBoxProps {
  question: MultiplicationQuestion;
  subtitle?: string;
}

export default function QuestionBox({ question, subtitle }: QuestionBoxProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-indigo-600/40 via-violet-600/30 to-fuchsia-600/30 p-5 text-center shadow-glow backdrop-blur-md">
      <div className="absolute inset-0 -z-10 opacity-30" style={{
        background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%)"
      }} />
      {subtitle && <p className="text-[11px] font-black uppercase tracking-widest text-white/80">{subtitle}</p>}
      <p className="mt-2 text-5xl font-black text-white drop-shadow-lg">
        <span className="text-amber-200">{question.left}</span>
        <span className="mx-2 text-white/70">×</span>
        <span className="text-cyan-200">{question.right}</span>
        <span className="mx-2 text-white/70">=</span>
        <span className="text-pink-200">?</span>
      </p>
    </div>
  );
}
