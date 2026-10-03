type BilingualText = {
  english: string;
  vietnamese: string;
};

type StructuredTutorAnswer = {
  grade_level: string;
  subject: string;
  difficulty_adaptation: BilingualText;
  explanation: BilingualText;
  examples: BilingualText[];
  illustration: BilingualText;
  follow_up_question: BilingualText;
};

function isBilingualText(value: unknown): value is BilingualText {
  return (
    typeof value === "object" &&
    value !== null &&
    "english" in value &&
    typeof value.english === "string" &&
    value.english.trim().length > 0 &&
    "vietnamese" in value &&
    typeof value.vietnamese === "string" &&
    value.vietnamese.trim().length > 0
  );
}

function parseTutorAnswer(content: string): StructuredTutorAnswer | null {
  try {
    const value: unknown = JSON.parse(content);
    if (
      typeof value !== "object" ||
      value === null ||
      !("grade_level" in value) ||
      typeof value.grade_level !== "string" ||
      !("subject" in value) ||
      typeof value.subject !== "string" ||
      !("difficulty_adaptation" in value) ||
      !isBilingualText(value.difficulty_adaptation) ||
      !("explanation" in value) ||
      !isBilingualText(value.explanation) ||
      !("examples" in value) ||
      !Array.isArray(value.examples) ||
      !value.examples.every(isBilingualText) ||
      !("illustration" in value) ||
      !isBilingualText(value.illustration) ||
      !("follow_up_question" in value) ||
      !isBilingualText(value.follow_up_question)
    ) {
      return null;
    }
    return {
      grade_level: value.grade_level,
      subject: value.subject,
      difficulty_adaptation: value.difficulty_adaptation,
      explanation: value.explanation,
      examples: value.examples,
      illustration: value.illustration,
      follow_up_question: value.follow_up_question,
    };
  } catch {
    return null;
  }
}

export function TutorAnswer({
  content,
  compact = false,
}: {
  content: string;
  compact?: boolean;
}) {
  const answer = parseTutorAnswer(content);
  if (!answer) {
    return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
  }

  const languageLabel = (language: "English" | "Tiếng Việt") => (
    <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
      {language}
    </span>
  );
  const bilingualGrid = "grid gap-3 sm:grid-cols-2";
  const panelClass =
    "min-w-0 rounded-xl border border-border/70 bg-background/70 p-3";

  return (
    <div className={`space-y-3 ${compact ? "text-xs" : "text-sm"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
          {answer.grade_level}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
          {answer.subject}
        </span>
      </div>

      <section className="space-y-2">
        <div className={bilingualGrid}>
          <div className={panelClass}>
            {languageLabel("English")}
            <p className="whitespace-pre-wrap leading-relaxed">
              {answer.explanation.english}
            </p>
          </div>
          <div className={panelClass}>
            {languageLabel("Tiếng Việt")}
            <p className="whitespace-pre-wrap leading-relaxed">
              {answer.explanation.vietnamese}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-primary/5 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">
            Mức độ phù hợp / Level:
          </span>{" "}
          {answer.difficulty_adaptation.english} /{" "}
          {answer.difficulty_adaptation.vietnamese}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-bold text-foreground">
          Ví dụ / Examples
        </h3>
        <div className="space-y-2">
          {answer.examples.map((example, index) => (
            <div key={index} className={panelClass}>
              <p className="whitespace-pre-wrap leading-relaxed">
                <span className="font-semibold text-foreground">EN: </span>
                {example.english}
              </p>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed">
                <span className="font-semibold text-foreground">VI: </span>
                {example.vietnamese}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-bold text-foreground">
          Minh họa / Illustration
        </h3>
        <div className={bilingualGrid}>
          <div className={panelClass}>
            {languageLabel("English")}
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
              {answer.illustration.english}
            </pre>
          </div>
          <div className={panelClass}>
            {languageLabel("Tiếng Việt")}
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
              {answer.illustration.vietnamese}
            </pre>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
        <h3 className="mb-1 text-xs font-bold text-foreground">
          Câu hỏi tiếp theo / Follow-up
        </h3>
        <p className="leading-relaxed">{answer.follow_up_question.english}</p>
        <p className="mt-1 leading-relaxed">
          {answer.follow_up_question.vietnamese}
        </p>
      </section>
    </div>
  );
}
