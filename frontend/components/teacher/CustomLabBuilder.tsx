"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, FileUp, Plus, Sparkles, Trash2, Volume2 } from "lucide-react";
import Link from "next/link";
import {
  createCustomLab,
  fetchCustomLab,
  translateLabText,
  updateCustomLab,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import type {
  BilingualText,
  CustomLabActivity,
  CustomLabInput,
  CustomLabRecord,
} from "@/types/custom-lab";

const blankPair = (): BilingualText => ({ vi: "", en: "" });

function PairFields({
  label,
  value,
  onChange,
  multiline = false,
  required = false,
}: {
  label: string;
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  multiline?: boolean;
  required?: boolean;
}) {
  const [sourceLanguage, setSourceLanguage] = useState<"vi" | "en" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [speechError, setSpeechError] = useState("");
  const requestId = useRef(0);
  const sourceLanguageRef = useRef<"vi" | "en" | null>(null);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const sourceText = sourceLanguage ? value[sourceLanguage] : "";

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  }, [onChange, value]);

  useEffect(() => {
    if (!sourceLanguage) return;
    const text = sourceText.trim();
    if (text.length < 2) return;
    const currentRequestId = requestId.current;
    const timeout = window.setTimeout(() => {
      void translateLabText(null, { text, sourceLanguage })
        .then((translated) => {
          if (
            requestId.current !== currentRequestId ||
            sourceLanguageRef.current !== sourceLanguage ||
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
          if (requestId.current === currentRequestId) setBusy(false);
        });
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [sourceLanguage, sourceText]);

  const updateText = (language: "vi" | "en", text: string) => {
    requestId.current += 1;
    sourceLanguageRef.current = language;
    setSourceLanguage(language);
    setBusy(text.trim().length >= 2);
    setError("");
    onChange({ ...value, [language]: text });
  };

  const speakEnglish = () => {
    const text = value.en.trim();
    if (!text) return;
    if (!("speechSynthesis" in window)) {
      setSpeechError("Trình duyệt không hỗ trợ phát âm.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onerror = () => setSpeechError("Không thể phát âm tiếng Anh.");
    setSpeechError("");
    window.speechSynthesis.speak(utterance);
  };

  const Field = multiline ? "textarea" : "input";

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-foreground">
        {label}
        {required ? " *" : ""}
      </legend>
      <div className="grid gap-2 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] text-muted-foreground">Tiếng Việt</span>
          <Field
            required={required}
            value={value.vi}
            onChange={(event) => updateText("vi", event.target.value)}
            placeholder="Nhập tiếng Việt"
            className={inputClass}
            rows={multiline ? 3 : undefined}
          />
        </label>
        <label className="space-y-1">
          <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
            English
            <button
              type="button"
              onClick={speakEnglish}
              disabled={!value.en.trim()}
              aria-label="Nghe phát âm tiếng Anh"
              className="inline-flex items-center gap-1 font-semibold text-primary disabled:opacity-40"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Nghe
            </button>
          </span>
          <Field
            required={required}
            value={value.en}
            onChange={(event) => updateText("en", event.target.value)}
            placeholder="Enter English"
            className={inputClass}
            rows={multiline ? 3 : undefined}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        {busy ? <span role="status" className="text-muted-foreground">Đang tự động dịch...</span> : null}
        {error ? <span role="alert" className="text-destructive">{error}</span> : null}
        {speechError ? <span role="alert" className="text-destructive">{speechError}</span> : null}
      </div>
    </fieldset>
  );
}

function createActivity(type: CustomLabActivity["type"]): CustomLabActivity {
  const base = {
    titleVi: "",
    titleEn: "",
    descriptionVi: "",
    descriptionEn: "",
  };
  if (type === "slider") {
    return {
      ...base,
      type,
      min: 0,
      max: 100,
      step: 1,
      initialValue: 50,
      unitVi: "",
      unitEn: "",
      lowResult: blankPair(),
      highResult: blankPair(),
    };
  }
  if (type === "switch") {
    return {
      ...base,
      type,
      initialOn: false,
      onLabel: { vi: "Bật", en: "On" },
      offLabel: { vi: "Tắt", en: "Off" },
      onResult: blankPair(),
      offResult: blankPair(),
    };
  }
  if (type === "quiz") {
    return {
      ...base,
      type,
      question: blankPair(),
      options: [blankPair(), blankPair()],
      correctIndex: 0,
      explanation: blankPair(),
    };
  }
  return { ...base, type: "observe", prompt: blankPair() };
}

function PairItem({
  index,
  label,
  value,
  onChange,
  onRemove,
  multiline = false,
}: {
  index: number;
  label: string;
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  onRemove: () => void;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold">{label} {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-destructive hover:bg-destructive/10"
          aria-label={`Xóa ${label.toLowerCase()} ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <PairFields
        label={label}
        value={value}
        onChange={onChange}
        multiline={multiline}
      />
    </div>
  );
}

function ActivityEditor({
  activity,
  index,
  onChange,
  onRemove,
}: {
  activity: CustomLabActivity;
  index: number;
  onChange: (activity: CustomLabActivity) => void;
  onRemove: () => void;
}) {
  const updatePair = (
    key: "prompt" | "question" | "explanation" | "lowResult" | "highResult" | "onLabel" | "offLabel" | "onResult" | "offResult",
    value: BilingualText,
  ) => {
    if (activity.type === "observe" && key === "prompt") {
      onChange({ ...activity, prompt: value });
    } else if (activity.type === "slider" && (key === "lowResult" || key === "highResult")) {
      onChange({ ...activity, [key]: value });
    } else if (activity.type === "switch" && (key === "onLabel" || key === "offLabel" || key === "onResult" || key === "offResult")) {
      onChange({ ...activity, [key]: value });
    } else if (activity.type === "quiz" && (key === "question" || key === "explanation")) {
      onChange({ ...activity, [key]: value });
    }
  };

  const textPair = (vi: string, en: string): BilingualText => ({ vi, en });

  return (
    <section className="space-y-4 rounded-2xl border border-primary/20 bg-primary/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold">
            Hoạt động {index + 1}: {activity.type === "observe" ? "Quan sát" : activity.type === "slider" ? "Thanh điều chỉnh" : activity.type === "switch" ? "Công tắc" : "Trắc nghiệm"}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Mẫu tương tác dựng sẵn — không cần viết code.
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
          aria-label={`Xóa hoạt động ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <PairFields
        label="Tên hoạt động / Activity title"
        value={textPair(activity.titleVi, activity.titleEn)}
        onChange={(value) =>
          onChange({
            ...activity,
            titleVi: value.vi,
            titleEn: value.en,
          })
        }
      />
      <PairFields
        label="Mô tả hoạt động / Activity description"
        value={textPair(activity.descriptionVi, activity.descriptionEn)}
        onChange={(value) =>
          onChange({
            ...activity,
            descriptionVi: value.vi,
            descriptionEn: value.en,
          })
        }
      />

      {activity.type === "observe" ? (
        <PairFields
          label="Nội dung quan sát"
          value={activity.prompt}
          onChange={(value) => updatePair("prompt", value)}
          multiline
          required
        />
      ) : null}

      {activity.type === "slider" ? (
        <>
          <div className="grid gap-2 sm:grid-cols-4">
            {([
              ["min", "Giá trị nhỏ nhất"],
              ["max", "Giá trị lớn nhất"],
              ["step", "Bước tăng"],
              ["initialValue", "Giá trị ban đầu"],
            ] as const).map(([field, label]) => (
              <label key={field} className="space-y-1 text-xs">
                <span>{label}</span>
                <input
                  type="number"
                  required
                  value={activity[field]}
                  onChange={(event) =>
                    onChange({ ...activity, [field]: Number(event.target.value) })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-xs">
              <span>Đơn vị tiếng Việt</span>
              <input
                value={activity.unitVi}
                onChange={(event) => onChange({ ...activity, unitVi: event.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                placeholder="cm, °C, V..."
              />
            </label>
            <label className="space-y-1 text-xs">
              <span>Unit in English</span>
              <input
                value={activity.unitEn}
                onChange={(event) => onChange({ ...activity, unitEn: event.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                placeholder="cm, °C, V..."
              />
            </label>
          </div>
          <PairFields label="Kết quả ở nửa dưới" value={activity.lowResult} onChange={(value) => updatePair("lowResult", value)} multiline required />
          <PairFields label="Kết quả ở nửa trên" value={activity.highResult} onChange={(value) => updatePair("highResult", value)} multiline required />
        </>
      ) : null}

      {activity.type === "switch" ? (
        <>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={activity.initialOn}
              onChange={(event) => onChange({ ...activity, initialOn: event.target.checked })}
            />
            Bật công tắc ban đầu
          </label>
          <PairFields label="Nhãn khi bật" value={activity.onLabel} onChange={(value) => updatePair("onLabel", value)} required />
          <PairFields label="Nhãn khi tắt" value={activity.offLabel} onChange={(value) => updatePair("offLabel", value)} required />
          <PairFields label="Kết quả khi bật" value={activity.onResult} onChange={(value) => updatePair("onResult", value)} multiline required />
          <PairFields label="Kết quả khi tắt" value={activity.offResult} onChange={(value) => updatePair("offResult", value)} multiline required />
        </>
      ) : null}

      {activity.type === "quiz" ? (
        <>
          <PairFields label="Câu hỏi" value={activity.question} onChange={(value) => updatePair("question", value)} multiline required />
          {activity.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-start gap-2">
              <label className="mt-8 flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  name={`correct-${index}`}
                  checked={activity.correctIndex === optionIndex}
                  onChange={() => onChange({ ...activity, correctIndex: optionIndex })}
                />
                Đúng
              </label>
              <div className="min-w-0 flex-1">
                <PairFields
                  label={`Lựa chọn ${optionIndex + 1}`}
                  value={option}
                  onChange={(value) => {
                    const options = activity.options.map((item, current) =>
                      current === optionIndex ? value : item,
                    );
                    onChange({ ...activity, options });
                  }}
                  required
                />
              </div>
              {activity.options.length > 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    const options = activity.options.filter((_, current) => current !== optionIndex);
                    onChange({
                      ...activity,
                      options,
                      correctIndex:
                        activity.correctIndex === optionIndex
                          ? 0
                          : activity.correctIndex > optionIndex
                            ? activity.correctIndex - 1
                            : activity.correctIndex,
                    });
                  }}
                  className="mt-8 rounded p-1 text-destructive"
                  aria-label={`Xóa lựa chọn ${optionIndex + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
          {activity.options.length < 6 ? (
            <button
              type="button"
              onClick={() => onChange({ ...activity, options: [...activity.options, blankPair()] })}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm lựa chọn
            </button>
          ) : null}
          <PairFields label="Giải thích đáp án" value={activity.explanation} onChange={(value) => updatePair("explanation", value)} multiline required />
        </>
      ) : null}

      {activity.type === "simulation" ? (
        <div className="space-y-2 rounded-xl bg-muted/40 p-3 text-xs">
          <p className="font-semibold">Mô phỏng tạo từ cấu hình JSON</p>
          <p>{activity.parameters.length} biến điều khiển · {activity.outputs.length} kết quả tính bằng công thức</p>
          <ul className="list-inside list-disc">
            {activity.outputs.map((output) => (
              <li key={output.id}>{output.labelVi} ({output.id} = {output.formula})</li>
            ))}
          </ul>
        </div>
      ) : null}

      {activity.type === "external" ? (
        <div className="space-y-2 rounded-xl bg-muted/40 p-3 text-xs">
          <p className="font-semibold">Mô phỏng nhúng: {activity.provider === "phet" ? "PhET" : "GeoGebra"}</p>
          <a href={activity.url} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline">
            {activity.url}
          </a>
        </div>
      ) : null}
    </section>
  );
}

const initialForm: CustomLabInput = {
  title: "",
  titleEn: "",
  subject: "science",
  grade: "7",
  summary: "",
  summaryEn: "",
  safetyNotice: "",
  safetyNoticeEn: "",
  equipment: [],
  steps: [{ ...blankPair(), safety: false }],
  vocabulary: [],
  activities: [],
  attachments: [],
};

function getAttachmentError(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const limits: Record<string, number> = {
    jpg: 15, jpeg: 15, png: 15, webp: 15,
    pdf: 50, docx: 50, pptx: 50, txt: 50,
    mp4: 500, webm: 500, mov: 500, avi: 500,
    glb: 100,
    html: 10, htm: 10,
  };
  const maxSize = limits[extension];
  if (!maxSize) return "Định dạng tệp chưa được hỗ trợ.";
  if (file.size > maxSize * 1024 * 1024) {
    return `Tệp ${file.name} vượt quá giới hạn ${maxSize} MB.`;
  }
  return "";
}

export function CustomLabBuilder({ labId }: { labId?: string }) {
  const router = useRouter();
  const { token } = useAuth();
  const { isLoading } = useAuthGuard({
    allowedRoles: ["TEACHER"],
    forbiddenRedirectTo: "/assignments",
  });
  const [form, setForm] = useState<CustomLabInput>(initialForm);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingLab, setIsLoadingLab] = useState(Boolean(labId));
  const [hasLoadedLab, setHasLoadedLab] = useState(!labId);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!labId) return;
    let active = true;
    fetchCustomLab(labId)
      .then((lab: CustomLabRecord) => {
        if (!active) return;
        setForm({
          title: lab.title,
          titleEn: lab.titleEn,
          subject: lab.subject,
          grade: lab.grade as CustomLabInput["grade"],
          summary: lab.summary,
          summaryEn: lab.summaryEn,
          safetyNotice: lab.safetyNotice || "",
          safetyNoticeEn: lab.safetyNoticeEn || "",
          equipment: lab.equipment ?? [],
          steps: lab.steps,
          vocabulary: lab.vocabulary,
          activities: lab.activities,
          attachments: lab.attachments ?? [],
        });
        setHasLoadedLab(true);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Không thể tải bài Lab để chỉnh sửa.");
        }
      })
      .finally(() => {
        if (active) setIsLoadingLab(false);
      });
    return () => {
      active = false;
    };
  }, [labId]);

  const setPair = (key: "title" | "summary", value: BilingualText) => {
    setForm((current) => ({
      ...current,
      [key]: value.vi,
      [key === "title" ? "titleEn" : "summaryEn"]: value.en,
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const input = {
        ...form,
        equipment: form.equipment
          .filter((item) => item.vi.trim() || item.en.trim())
          .map((item) => ({ vi: item.vi.trim(), en: item.en.trim() })),
      };
      const saved = labId
        ? await updateCustomLab(token, labId, input, selectedFiles)
        : await createCustomLab(token, input, selectedFiles);
      router.push(`/lab/custom/${saved.id}`);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Không thể lưu bài Lab.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="py-24 text-center text-muted-foreground">Đang kiểm tra quyền truy cập...</p>;
  }
  if (isLoadingLab) {
    return <p className="py-24 text-center text-muted-foreground">Đang tải bài Lab...</p>;
  }
  if (labId && !hasLoadedLab) {
    return (
      <main className="min-h-screen px-4 pt-32 text-center">
        <p role="alert" className="text-sm text-destructive">{error}</p>
        <Link href="/lab" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
          Quay lại phòng Lab
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 pb-16 pt-24">
      <div className="mx-auto max-w-4xl">
        <Link href="/lab" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Quay lại phòng Lab
        </Link>
        <header className="mb-8">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {labId ? "Chỉnh sửa Lab" : "Tạo Lab không cần code"}
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            {labId ? "Chỉnh sửa Lab" : "Lab Builder"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Tạo bài thí nghiệm bằng các mẫu tương tác có sẵn. Nhập nội dung tiếng Việt hoặc tiếng Anh rồi dịch sang ngôn ngữ còn lại khi cần.
          </p>
        </header>

        <form onSubmit={submit} className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold">1. Thông tin thí nghiệm</h2>
            <PairFields
              label="Tên thí nghiệm / Experiment title"
              value={{ vi: form.title, en: form.titleEn }}
              onChange={(value) => setPair("title", value)}
              required
            />
            <PairFields
              label="Mục tiêu / Summary"
              value={{ vi: form.summary, en: form.summaryEn }}
              onChange={(value) => setPair("summary", value)}
              multiline
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-semibold">
                <span>Môn học</span>
                <select
                  value={form.subject}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subject: event.target.value as CustomLabInput["subject"],
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="science">Khoa học tự nhiên</option>
                  <option value="physics">Vật lý</option>
                  <option value="chemistry">Hóa học</option>
                  <option value="biology">Sinh học</option>
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold">
                <span>Lớp</span>
                <select
                  value={form.grade}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      grade: event.target.value as CustomLabInput["grade"],
                    }))
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((grade) => (
                    <option key={grade} value={grade}>Lớp {grade}</option>
                  ))}
                </select>
              </label>
            </div>
            <PairFields
              label="Lưu ý an toàn / Safety notice"
              value={{ vi: form.safetyNotice, en: form.safetyNoticeEn }}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  safetyNotice: value.vi,
                  safetyNoticeEn: value.en,
                }))
              }
              multiline
            />
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div>
              <h2 className="text-lg font-bold">2. Tệp minh họa và học liệu</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Tải học liệu hoặc file HTML để hiển thị bài Lab tương tác ngay trong trang.
                HTML được chạy trong iframe sandbox. Hỗ trợ JPG/PNG/WebP (15 MB), PDF/DOCX/PPTX/TXT (50 MB), HTML (10 MB), video (500 MB), GLB (100 MB), tối đa 10 tệp.
              </p>
              <p className="text-xs font-medium text-primary">
                Ảnh đại diện Lab sẽ được tạo tự động khi lưu bài.
              </p>
            </div>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center hover:bg-muted/40">
              <FileUp className="h-6 w-6 text-primary" />
              <span className="text-sm font-semibold">Chọn tệp từ thiết bị</span>
              <span className="text-xs text-muted-foreground">Ảnh, PDF, tài liệu, video, mô hình .glb và bài Lab .html</span>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.pptx,.txt,.mp4,.webm,.mov,.avi,.glb,.html,.htm"
                className="sr-only"
                disabled={isSaving}
                onChange={(event) => {
                  const incoming = Array.from(event.currentTarget.files ?? []);
                  const remaining = Math.max(0, 10 - selectedFiles.length - form.attachments.length);
                  const accepted: File[] = [];
                  let validationMessage = "";
                  for (const file of incoming) {
                    if (accepted.length >= remaining) {
                      validationMessage = "Mỗi bài Lab chỉ đính kèm tối đa 10 tệp.";
                      break;
                    }
                    const fileError = getAttachmentError(file);
                    if (fileError) {
                      validationMessage = fileError;
                      continue;
                    }
                    accepted.push(file);
                  }
                  setSelectedFiles((current) => [...current, ...accepted]);
                  setError(validationMessage);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            {form.attachments.length ? (
              <ul className="space-y-2">
                {form.attachments.map((attachment, index) => (
                  <li key={`${attachment.url}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-xs">
                    <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate font-medium text-primary hover:underline">
                      {attachment.name}
                    </a>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setForm((current) => ({
                        ...current,
                        attachments: current.attachments.filter((_, attachmentIndex) => attachmentIndex !== index),
                      }))}
                      className="shrink-0 rounded px-2 py-1 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      aria-label={`Xóa tệp ${attachment.name}`}
                    >
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {selectedFiles.length ? (
              <ul className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <li key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-xs">
                    <span className="min-w-0 truncate font-medium">{file.name} <span className="text-muted-foreground">({(file.size / (1024 * 1024)).toFixed(1)} MB)</span></span>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setSelectedFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                      className="shrink-0 rounded px-2 py-1 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      aria-label={`Xóa tệp ${file.name}`}
                    >
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">3. Dụng cụ thí nghiệm</h2>
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, equipment: [...current.equipment, blankPair()] }))}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm dụng cụ
              </button>
            </div>
            {form.equipment.map((item, index) => (
              <PairItem
                key={index}
                index={index}
                label="Dụng cụ"
                value={item}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    equipment: current.equipment.map((entry, i) => i === index ? value : entry),
                  }))
                }
                onRemove={() =>
                  setForm((current) => ({
                    ...current,
                    equipment: current.equipment.filter((_, i) => i !== index),
                  }))
                }
              />
            ))}
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">4. Các bước tiến hành</h2>
              <button
                type="button"
                onClick={() => setForm((current) => ({ ...current, steps: [...current.steps, { ...blankPair(), safety: false }] }))}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm bước
              </button>
            </div>
            {form.steps.map((item, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Bước {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, steps: current.steps.filter((_, i) => i !== index) }))}
                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                    aria-label={`Xóa bước ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <PairFields
                  label={`Nội dung bước ${index + 1}`}
                  value={item}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      steps: current.steps.map((entry, i) => i === index ? { ...entry, ...value } : entry),
                    }))
                  }
                  multiline
                  required
                />
                <label className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                  <input
                    type="checkbox"
                    checked={item.safety}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        steps: current.steps.map((entry, i) => i === index ? { ...entry, safety: event.target.checked } : entry),
                      }))
                    }
                  />
                  Đánh dấu đây là bước/cảnh báo an toàn
                </label>
              </div>
            ))}
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">5. Thuật ngữ chuyên ngành</h2>
                <p className="text-xs text-muted-foreground">Thêm thuật ngữ Việt/Anh và IPA để học sinh luyện phát âm.</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((current) => ({
                  ...current,
                  vocabulary: [...current.vocabulary, { ...blankPair(), ipa: "", definitionVi: "", definitionEn: "" }],
                }))}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm thuật ngữ
              </button>
            </div>
            {form.vocabulary.map((item, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Thuật ngữ {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, vocabulary: current.vocabulary.filter((_, i) => i !== index) }))}
                    className="rounded p-1 text-destructive hover:bg-destructive/10"
                    aria-label={`Xóa thuật ngữ ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <PairFields
                  label="Thuật ngữ / Term"
                  value={item}
                  onChange={(value) => setForm((current) => ({
                    ...current,
                    vocabulary: current.vocabulary.map((entry, i) => i === index ? { ...entry, ...value } : entry),
                  }))}
                  required
                />
                <label className="block space-y-1 text-xs">
                  <span>Phiên âm IPA</span>
                  <input
                    value={item.ipa}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      vocabulary: current.vocabulary.map((entry, i) => i === index ? { ...entry, ipa: event.target.value } : entry),
                    }))}
                    placeholder="/.../"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2"
                  />
                </label>
                <PairFields
                  label="Giải nghĩa thuật ngữ / Term definition (không bắt buộc)"
                  value={{ vi: item.definitionVi, en: item.definitionEn }}
                  onChange={(value) => setForm((current) => ({
                    ...current,
                    vocabulary: current.vocabulary.map((entry, i) =>
                      i === index
                        ? { ...entry, definitionVi: value.vi, definitionEn: value.en }
                        : entry,
                    ),
                  }))}
                  multiline
                />
              </div>
            ))}
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">6. Hoạt động và câu hỏi củng cố</h2>
                <p className="text-xs text-muted-foreground">Chọn khối tương tác có sẵn và nhập nội dung; không cần lập trình.</p>
              </div>
              <select
                aria-label="Chọn loại hoạt động"
                defaultValue=""
                onChange={(event) => {
                  if (!event.target.value) return;
                  const type = event.target.value as CustomLabActivity["type"];
                  setForm((current) => ({ ...current, activities: [...current.activities, createActivity(type)] }));
                  event.target.value = "";
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold"
              >
                <option value="" disabled>+ Thêm hoạt động</option>
                <option value="observe">Thẻ quan sát</option>
                <option value="slider">Thanh điều chỉnh và kết quả</option>
                <option value="switch">Công tắc bật/tắt</option>
                <option value="quiz">Câu hỏi trắc nghiệm</option>
              </select>
            </div>
            {form.activities.map((activity, index) => (
              <ActivityEditor
                key={index}
                activity={activity}
                index={index}
                onChange={(updated) => setForm((current) => ({
                  ...current,
                  activities: current.activities.map((entry, i) => i === index ? updated : entry),
                }))}
                onRemove={() => setForm((current) => ({
                  ...current,
                  activities: current.activities.filter((_, i) => i !== index),
                }))}
              />
            ))}
          </section>

          {error ? (
            <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3">
            <Link href="/lab" className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {isSaving
                ? selectedFiles.length
                  ? "Đang tải tệp và lưu Lab..."
                  : "Đang lưu Lab..."
                : labId ? "Lưu thay đổi" : "Tạo bài Lab"}
              {!isSaving ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
