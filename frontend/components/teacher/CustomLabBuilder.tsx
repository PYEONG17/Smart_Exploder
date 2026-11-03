"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, FileUp, Plus, Sparkles, Trash2, Volume2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
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
  autoFocus = false,
}: {
  label: string;
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  multiline?: boolean;
  required?: boolean;
  autoFocus?: boolean;
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
            autoFocus={autoFocus}
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

function PairItem({
  index,
  label,
  value,
  onChange,
  onRemove,
  multiline = false,
  autoFocus = false,
}: {
  index: number;
  label: string;
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  onRemove: () => void;
  multiline?: boolean;
  autoFocus?: boolean;
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
        autoFocus={autoFocus}
      />
    </div>
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
    tsx: 10,
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
  const [autoFocusField, setAutoFocusField] = useState<{
    section: "equipment" | "steps" | "vocabulary";
    index: number;
  } | null>(null);
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
        title: form.title.trim() || form.titleEn.trim(),
        titleEn: form.titleEn.trim() || form.title.trim() || form.titleEn.trim(),
        steps: form.steps.filter((step) => step.vi.trim() || step.en.trim()),
        equipment: form.equipment
          .filter((item) => item.vi.trim() || item.en.trim())
          .map((item) => ({ vi: item.vi.trim(), en: item.en.trim() })),
        vocabulary: form.vocabulary.filter((item) => item.vi.trim() || item.en.trim()),
      };
      if (!input.title) {
        setError("Vui lòng nhập tên bài Lab bằng tiếng Việt hoặc tiếng Anh.");
        return;
      }
      if (labId) {
        await updateCustomLab(token, labId, input, selectedFiles);
        toast.success("Cập nhật bài Lab thành công.");
      } else {
        await createCustomLab(token, input, selectedFiles);
        toast.success("Tạo bài Lab thành công.");
      }
      router.push("/lab?tab=custom");
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
        <Link href="/lab?tab=custom" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
          Quay lại danh sách Lab
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 pb-16 pt-24">
      <div className="mx-auto max-w-4xl">
        <Link href="/lab?tab=custom" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách Lab
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
            <p className="text-xs text-muted-foreground">
              Chỉ cần nhập tên bài Lab. Mô tả, các bước và học liệu có thể bổ sung sau.
            </p>
            <PairFields
              label="Tên thí nghiệm / Experiment title"
              value={{ vi: form.title, en: form.titleEn }}
              onChange={(value) => setPair("title", value)}
            />
            <PairFields
              label="Mục tiêu / Summary"
              value={{ vi: form.summary, en: form.summaryEn }}
              onChange={(value) => setPair("summary", value)}
              multiline
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
                HTML được chạy trong iframe sandbox. Tệp TSX được biên dịch thành mô phỏng React và chạy trong sandbox riêng (mỗi Lab một mô phỏng). Hỗ trợ JPG/PNG/WebP (15 MB), PDF/DOCX/PPTX/TXT (50 MB), HTML/TSX (10 MB), video (500 MB), GLB (100 MB), tối đa 10 tệp.
              </p>
              <p className="text-xs font-medium text-primary">
                Ảnh đại diện Lab sẽ được tạo tự động khi lưu bài.
              </p>
            </div>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center hover:bg-muted/40">
              <FileUp className="h-6 w-6 text-primary" />
              <span className="text-sm font-semibold">Chọn tệp từ thiết bị</span>
              <span className="text-xs text-muted-foreground">Ảnh, PDF, tài liệu, video, mô hình .glb, bài Lab .html hoặc mô phỏng React .tsx</span>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.pptx,.txt,.mp4,.webm,.mov,.avi,.glb,.html,.htm,.tsx"
                className="sr-only"
                disabled={isSaving}
                onChange={(event) => {
                  const incoming = Array.from(event.currentTarget.files ?? []);
                  const remaining = Math.max(0, 10 - selectedFiles.length - form.attachments.length);
                  const accepted: File[] = [];
                  let validationMessage = "";
                  let hasSimulation = form.attachments.some(({ type }) => type === "SIMULATION") ||
                    selectedFiles.some((file) => file.name.toLowerCase().endsWith(".tsx"));
                  for (const file of incoming) {
                    if (accepted.length >= remaining) {
                      validationMessage = "Mỗi bài Lab chỉ đính kèm tối đa 10 tệp.";
                      break;
                    }
                    if (file.name.toLowerCase().endsWith(".tsx") && hasSimulation) {
                      validationMessage = "Mỗi bài Lab chỉ tải lên một mô phỏng TSX.";
                      continue;
                    }
                    const fileError = getAttachmentError(file);
                    if (fileError) {
                      validationMessage = fileError;
                      continue;
                    }
                    accepted.push(file);
                    if (file.name.toLowerCase().endsWith(".tsx")) hasSimulation = true;
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
            <h2 className="text-lg font-bold">3. Dụng cụ thí nghiệm</h2>
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
                autoFocus={autoFocusField?.section === "equipment" && autoFocusField.index === index}
              />
            ))}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setAutoFocusField({ section: "equipment", index: form.equipment.length });
                  setForm((current) => ({ ...current, equipment: [...current.equipment, blankPair()] }));
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm dụng cụ
              </button>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold">4. Các bước tiến hành</h2>
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
                  autoFocus={autoFocusField?.section === "steps" && autoFocusField.index === index}
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
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setAutoFocusField({ section: "steps", index: form.steps.length });
                  setForm((current) => ({ ...current, steps: [...current.steps, { ...blankPair(), safety: false }] }));
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm bước
              </button>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">5. Thuật ngữ chuyên ngành</h2>
                <p className="text-xs text-muted-foreground">Thêm thuật ngữ Việt/Anh và IPA để học sinh luyện phát âm.</p>
              </div>
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
                  autoFocus={autoFocusField?.section === "vocabulary" && autoFocusField.index === index}
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
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setAutoFocusField({ section: "vocabulary", index: form.vocabulary.length });
                  setForm((current) => ({
                    ...current,
                    vocabulary: [...current.vocabulary, { ...blankPair(), ipa: "", definitionVi: "", definitionEn: "" }],
                  }));
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm thuật ngữ
              </button>
            </div>
          </section>

          {error ? (
            <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3">
            <Link href="/lab?tab=custom" className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
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
