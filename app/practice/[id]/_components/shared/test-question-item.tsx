"use client";

import type { Question, QuestionGroup } from "@/lib/types";

const ROMAN_NUMERALS = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];

export function QuestionGroupBlock({
  group,
  groupIndex,
  answers,
  onAnswerChange,
  displayNumberStart = 0,
}: {
  group: QuestionGroup;
  groupIndex: number;
  answers: Record<string, string>;
  onAnswerChange: (id: string, val: string) => void;
  displayNumberStart?: number;
}) {
  const questions = group.questions ?? [];

  const firstDisplayNum = displayNumberStart + 1;
  const lastDisplayNum = displayNumberStart + questions.length;
  const rangeLabel =
    questions.length === 0
      ? `Group ${groupIndex + 1}`
      : firstDisplayNum === lastDisplayNum
        ? `Question ${firstDisplayNum}`
        : `Questions ${firstDisplayNum} – ${lastDisplayNum}`;

  const answeredInGroup = questions.filter((q) => answers[q.id]?.trim()).length;

  return (
    <div className="space-y-2.5">
      {/* Group header */}
      <div className="rounded-lg border border-border bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/60">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary/80">
            {rangeLabel}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {answeredInGroup}/{questions.length}
          </span>
        </div>

        {/* Instructions */}
        <div className="px-3.5 py-2.5">
          {group.instructions ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed prose-p:my-1 prose-strong:font-bold text-[0.8125rem] [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:bg-muted/50 [&_th]:font-semibold"
              dangerouslySetInnerHTML={{ __html: group.instructions }}
            />
          ) : (
            <p className="text-xs text-muted-foreground">Answer based on the content.</p>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-2">
        {questions.map((q, localIdx) => (
          <QuestionItem
            key={q.id}
            question={q}
            answer={answers[q.id] ?? ""}
            onAnswerChange={onAnswerChange}
            displayOrder={displayNumberStart + localIdx + 1}
          />
        ))}
      </div>
    </div>
  );
}

export function QuestionItem({
  question,
  answer,
  onAnswerChange,
  displayOrder,
}: {
  question: Question;
  answer: string;
  onAnswerChange: (id: string, val: string) => void;
  displayOrder?: number;
}) {
  const { id, questionOrder, questionText, questionType, config } = question;
  const shownOrder = displayOrder ?? questionOrder;

  const options: string[] = config?.options ?? config?.choices ?? [];
  const isMcq = questionType === "multiple_choice";
  const isTrueFalse =
    questionType === "true_false" ||
    questionType === "true_false_not_given" ||
    questionType === "yes_no_not_given";
  const isDropdown =
    isTrueFalse ||
    questionType === "matching" ||
    questionType === "sentence_ending" ||
    questionType === "matching_features";
  const isMatchingHeading = questionType === "matching_heading";

  const dropdownOptions = isTrueFalse
    ? questionType === "yes_no_not_given"
      ? ["YES", "NO", "NOT GIVEN"]
      : ["TRUE", "FALSE", "NOT GIVEN"]
    : options;

  const headingOptions = isMatchingHeading ? options : [];

  const hasText = !!questionText;
  const isInline = !hasText && !isMcq && !isDropdown && !isMatchingHeading;

  return (
    <div
      id={`q-container-${id}`}
      className="bg-white dark:bg-slate-900 border border-border rounded-lg px-4 py-3 shadow-sm hover:border-primary/30 transition-all duration-200"
    >
      {isInline ? (
        /* Inline fill-in-blank */
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-extrabold select-none">
            {shownOrder}
          </span>
          <input
            type="text"
            value={answer}
            placeholder="Your answer…"
            onChange={(e) => onAnswerChange(id, e.target.value)}
            className="flex-1 h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-shadow placeholder:text-muted-foreground/60"
          />
        </div>
      ) : (
        <>
          {/* Header row */}
          <div className="flex items-start gap-3 mb-2.5">
            <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-extrabold select-none mt-0.5">
              {shownOrder}
            </span>
            {hasText && (
              <div
                className="flex-1 text-[0.8125rem] font-medium leading-relaxed text-foreground [&>p]:m-0"
                dangerouslySetInnerHTML={{ __html: questionText! }}
              />
            )}
            {/* If there's an image in the question config, display it */}
            {config?.imageUrl && (
              <div className="mt-3 w-full max-w-md">
                <img src={config.imageUrl} alt="Question reference" className="rounded-md border border-slate-200" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="ml-10">
            {isMcq ? (
              <div className="space-y-1.5">
                {options.map((opt, i) => {
                  const optVal =
                    typeof opt === "object"
                      ? String((opt as any).value ?? opt)
                      : opt;
                  const isSelected = answer === optVal;
                  const optLabel = String.fromCharCode(65 + i);
                  return (
                    <label
                      key={i}
                      className={`flex items-start gap-2.5 px-3 py-2 rounded-md cursor-pointer border transition-all text-[0.8125rem] ${
                        isSelected
                          ? "bg-primary/10 border-primary/40"
                          : "bg-background border-border hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${id}`}
                        value={optVal}
                        checked={isSelected}
                        onChange={(e) => onAnswerChange(id, e.target.value)}
                        className="mt-0.5 w-3.5 h-3.5 accent-primary flex-shrink-0"
                      />
                      <span>
                        <span className={`font-bold mr-1 ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                          {optLabel}.
                        </span>
                        <span className={isSelected ? "font-semibold text-foreground" : "text-foreground"}>
                          {optVal}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : isDropdown ? (
              <div className="space-y-1.5">
                <select
                  value={answer}
                  onChange={(e) => onAnswerChange(id, e.target.value)}
                  className="w-full max-w-[260px] h-9 rounded-md border border-border bg-background px-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-sm"
                >
                  <option value="" disabled>— Select —</option>
                  {dropdownOptions.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    return (
                      <option key={i} value={isTrueFalse ? opt : letter}>
                        {isTrueFalse ? opt : `${letter}. ${opt}`}
                      </option>
                    );
                  })}
                </select>
                {answer && !isTrueFalse && dropdownOptions.length > 0 && (
                  <p className="text-[11px] text-primary/80 font-semibold flex items-center gap-1">
                    <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded bg-primary/10 text-primary font-bold text-[10px] px-1">
                      {answer}
                    </span>
                    {dropdownOptions[answer.charCodeAt(0) - 65] ?? ""}
                  </p>
                )}
              </div>
            ) : isMatchingHeading ? (
              <div className="space-y-1.5">
                <select
                  value={answer}
                  onChange={(e) => onAnswerChange(id, e.target.value)}
                  className="w-full max-w-[280px] h-9 rounded-md border border-border bg-background px-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-sm"
                >
                  <option value="" disabled>— Select a heading —</option>
                  {headingOptions.map((opt, i) => {
                    const numeral = ROMAN_NUMERALS[i] ?? String(i + 1);
                    return (
                      <option key={numeral} value={numeral}>
                        {numeral}. {opt}
                      </option>
                    );
                  })}
                </select>
                {answer && headingOptions.length > 0 && (
                  <p className="text-[11px] text-primary/80 font-semibold flex items-center gap-1">
                    <span className="inline-flex items-center justify-center bg-primary/10 text-primary font-bold text-[10px] px-1.5 py-0.5 rounded">
                      {answer}
                    </span>
                    {headingOptions[ROMAN_NUMERALS.indexOf(answer)] ?? ""}
                  </p>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={answer}
                placeholder="Your answer…"
                onChange={(e) => onAnswerChange(id, e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-shadow placeholder:text-muted-foreground/60"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
