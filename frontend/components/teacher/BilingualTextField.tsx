"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { translateLabText } from "@/lib/api";

export type BilingualTextValue = {
  vi: string;
  en: string;
};

export function BilingualTextField({
  label,
  value,
  onChange,
  multiline = false,
  disabled = false,
}: {
  label: string;
  value: BilingualTextValue;
  onChange: (value: BilingualTextValue) => void;
  multiline?: boolean;
  disabled?: boolean;
}) {
  const [sourceLanguage, setSourceLanguage] = useState<"vi" | "en" | null>(
    null,
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState("");
  const [speechError, setSpeechError] = useState("");
  const requestId = useRef(0);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const sourceText = sourceLanguage ? value[sourceLanguage] : "";

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  }, [onChange, value]);

  useEffect(() => {
    if (!sourceLanguage) return;
    const text = sourceText.trim();
    if (text.length < 2) {
      setIsTranslating(false);
      return;
    }

    const currentRequestId = requestId.current;
    const timeout = window.setTimeout(() => {
      void translateLabText(null, { text, sourceLanguage })
        .then((translated) => {
          if (
            requestId.current !== currentRequestId ||
            valueRef.current[sourceLanguage].trim() !== text
          ) {
            return;
          }
          onChangeRef.current({
            ...valueRef.current,
            [sourceLanguage === "vi" ? "en" : "vi"]: translated,
          });
        })
        .catch((translationError: unknown) => {
          if (requestId.current !== currentRequestId) return;
          setError(
            translationError instanceof Error
              ? translationError.message
              : "Không thể dịch nội dung.",
          );
        })
        .finally(() => {
          if (requestId.current === currentRequestId) {
            setIsTranslating(false);
          }
        });
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [sourceLanguage, sourceText]);

  const updateText = (language: "vi" | "en", text: string) => {
    requestId.current += 1;
    setSourceLanguage(language);
    setIsTranslating(text.trim().length >= 2);
    setError("");
    onChange({ ...value, [language]: text });
  };

  const speak = (language: "vi" | "en") => {
    const text = value[language].trim();
    if (!text) return;
    if (!("speechSynthesis" in window)) {
      setSpeechError("Trình duyệt không hỗ trợ phát âm.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "vi" ? "vi-VN" : "en-US";
    utterance.onerror = () => setSpeechError("Không thể phát âm nội dung.");
    setSpeechError("");
    window.speechSynthesis.speak(utterance);
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60";
  const Field = multiline ? "textarea" : "input";

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-foreground">{label}</legend>
      <div className="grid gap-3 md:grid-cols-2">
        {(["vi", "en"] as const).map((language) => (
          <label key={language} className="space-y-1">
            <span className="flex items-center justify-between text-[11px] text-muted-foreground">
              {language === "vi" ? "Tiếng Việt" : "English"}
              <button
                type="button"
                onClick={() => speak(language)}
                disabled={!value[language].trim() || disabled}
                aria-label={
                  language === "vi"
                    ? "Nghe phát âm tiếng Việt"
                    : "Nghe phát âm tiếng Anh"
                }
                className="inline-flex items-center gap-1 font-semibold text-primary disabled:opacity-40"
              >
                <Volume2 className="h-3.5 w-3.5" />
                Nghe
              </button>
            </span>
            <Field
              value={value[language]}
              onChange={(event) => updateText(language, event.target.value)}
              placeholder={
                language === "vi" ? "Nhập tiếng Việt" : "Enter English"
              }
              className={inputClass}
              rows={multiline ? 4 : undefined}
              disabled={disabled}
            />
          </label>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Nhập nội dung ở một ngôn ngữ; ngôn ngữ còn lại sẽ tự dịch sau khi bạn
        ngừng gõ. Có thể chỉnh sửa bản dịch.
      </p>
      <div className="flex flex-wrap gap-2 text-[11px]">
        {isTranslating && (
          <span role="status" className="text-muted-foreground">
            Đang tự động dịch...
          </span>
        )}
        {error && <span role="alert" className="text-destructive">{error}</span>}
        {speechError && (
          <span role="alert" className="text-destructive">{speechError}</span>
        )}
      </div>
    </fieldset>
  );
}
