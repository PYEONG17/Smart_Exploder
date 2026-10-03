"use client";

import { Languages } from "lucide-react";

export type AuthoringLanguage = "vi" | "en";

type Props = {
  value: AuthoringLanguage;
  onChange: (language: AuthoringLanguage) => void;
  disabled?: boolean;
};

const options: { value: AuthoringLanguage; label: string }[] = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

export function AuthoringLanguageToggle({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Languages className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">
          Ngôn ngữ bạn nhập / Language you write in
        </span>
        <div
          role="radiogroup"
          aria-label="Authoring language"
          className="inline-flex rounded-lg border border-border bg-background p-0.5"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={value === option.value}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                value === option.value
                  ? "bg-blue-600 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Chỉ cần nhập một ngôn ngữ — hệ thống tự dịch sang ngôn ngữ còn lại. /
        Write in one language; the other is translated automatically.
      </p>
    </div>
  );
}
