"use client";

import { useState } from "react";
import { ListChecks, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createVideoActivity,
  deleteVideoActivity,
  fetchVideoActivities,
  updateVideoActivity,
  type VideoActivityRecord,
} from "@/lib/api";
import {
  AuthoringLanguageToggle,
  type AuthoringLanguage,
} from "./AuthoringLanguageToggle";

type QuestionForm = {
  id: string | null;
  timestamp: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  rewindSeconds: string;
};

type JsonForm = {
  id: string;
  timestamp: string;
  type: VideoActivityRecord["type"];
  content: string;
};

const DEFAULT_REWIND_SECONDS = "20";
const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function textList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function formatTime(timestampMs: number) {
  const totalSeconds = Math.floor(timestampMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function emptyForm(timestamp: string): QuestionForm {
  return {
    id: null,
    timestamp,
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
    rewindSeconds: DEFAULT_REWIND_SECONDS,
  };
}

function formFromRecord(
  record: VideoActivityRecord,
  language: AuthoringLanguage,
): QuestionForm {
  const content = record.content;
  const english = language === "en";
  const options = textList(english ? content.optionsEn : content.options);
  const fallbackOptions = textList(content.options);
  return {
    id: record.id,
    timestamp: String(record.timestampMs / 1000),
    question:
      (english ? text(content.questionEn) : "") || text(content.question),
    options: options.length === fallbackOptions.length ? options : fallbackOptions,
    correctIndex:
      typeof content.correctIndex === "number" ? content.correctIndex : 0,
    explanation:
      (english ? text(content.explanationEn) : "") || text(content.explanation),
    rewindSeconds:
      typeof content.rewindSeconds === "number"
        ? String(content.rewindSeconds)
        : DEFAULT_REWIND_SECONDS,
  };
}

function isQuestion(record: VideoActivityRecord) {
  return record.type === "QUESTION" || record.type === "QUIZ";
}

function describe(record: VideoActivityRecord) {
  const content = record.content;
  return (
    text(content.question) ||
    text(content.prompt) ||
    text(content.text) ||
    text(content.term) ||
    record.type
  );
}

export function VideoCheckpointManager({
  token,
  videoId,
  selectedTime,
}: {
  token: string;
  videoId: string;
  selectedTime: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<VideoActivityRecord[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [language, setLanguage] = useState<AuthoringLanguage>("vi");
  const [form, setForm] = useState<QuestionForm | null>(null);
  const [jsonForm, setJsonForm] = useState<JsonForm | null>(null);


  const load = async () => {
    setIsLoading(true);
    try {
      setItems(await fetchVideoActivities(token, videoId));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tải checkpoint.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && items === null) void load();
  };

  const upsert = (record: VideoActivityRecord) =>
    setItems((current) =>
      [...(current ?? []).filter((item) => item.id !== record.id), record].sort(
        (first, second) => first.timestampMs - second.timestampMs,
      ),
    );

  const startCreate = () => {
    setJsonForm(null);
    setForm(emptyForm(selectedTime || "0"));
  };

  const startEdit = (record: VideoActivityRecord) => {
    if (isQuestion(record)) {
      setJsonForm(null);
      setForm(formFromRecord(record, language));
    } else {
      setForm(null);
      setJsonForm({
        id: record.id,
        timestamp: String(record.timestampMs / 1000),
        type: record.type,
        content: JSON.stringify(record.content, null, 2),
      });
    }
  };

  const changeLanguage = (next: AuthoringLanguage) => {
    setLanguage(next);
    const record = form?.id ? items?.find((item) => item.id === form.id) : null;
    if (record) setForm(formFromRecord(record, next));
  };

  const parseSeconds = (value: string) => {
    const seconds = Number(value);
    if (value.trim() === "" || !Number.isFinite(seconds) || seconds < 0) {
      return null;
    }
    return Math.round(seconds * 1000);
  };

  const handleSaveQuestion = async () => {
    if (!form) return;
    const timestampMs = parseSeconds(form.timestamp);
    if (timestampMs === null) {
      return toast.error("Thời điểm phải là số giây hợp lệ.");
    }
    const options = form.options.map((option) => option.trim());
    if (form.question.trim().length < 2 || options.some((option) => !option)) {
      return toast.error("Cần có câu hỏi và điền đủ các lựa chọn.");
    }
    const rewind = Number(form.rewindSeconds);
    if (!Number.isInteger(rewind) || rewind < 0 || rewind > 3600) {
      return toast.error("Số giây tua lại phải từ 0 đến 3600.");
    }
    setIsSaving(true);
    try {
      const payload = {
        timestampMs,
        type: "QUESTION" as const,
        sourceLanguage: language,
        content: {
          question: form.question.trim(),
          options,
          correctIndex: form.correctIndex,
          explanation: form.explanation.trim() || undefined,
          rewindSeconds: rewind,
        },
      };
      const saved = form.id
        ? await updateVideoActivity(token, form.id, payload)
        : await createVideoActivity(token, videoId, payload);
      upsert(saved);
      setForm(null);
      toast.success(form.id ? "Đã cập nhật checkpoint." : "Đã thêm checkpoint.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu checkpoint.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveJson = async () => {
    if (!jsonForm) return;
    const timestampMs = parseSeconds(jsonForm.timestamp);
    if (timestampMs === null) {
      return toast.error("Thời điểm phải là số giây hợp lệ.");
    }
    let content: unknown;
    try {
      content = JSON.parse(jsonForm.content);
    } catch {
      return toast.error("JSON nội dung không hợp lệ.");
    }
    setIsSaving(true);
    try {
      const saved = await updateVideoActivity(token, jsonForm.id, {
        timestampMs,
        type: jsonForm.type,
        content,
      });
      upsert(saved);
      setJsonForm(null);
      toast.success("Đã cập nhật hoạt động.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu hoạt động.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (record: VideoActivityRecord) => {
    if (!window.confirm(`Xóa mốc ${formatTime(record.timestampMs)}?`)) return;
    try {
      await deleteVideoActivity(token, record.id);
      setItems((current) => (current ?? []).filter((item) => item.id !== record.id));
      if (form?.id === record.id) setForm(null);
      if (jsonForm?.id === record.id) setJsonForm(null);
      toast.success("Đã xóa checkpoint.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa checkpoint.",
      );
    }
  };

  const patchForm = (patch: Partial<QuestionForm>) =>
    setForm((current) => (current ? { ...current, ...patch } : current));

  return (
    <div className="space-y-2">
      <Button type="button" size="sm" variant="outline" onClick={handleToggle}>
        <ListChecks className="mr-1 h-3.5 w-3.5" />
        {open ? "Ẩn checkpoint" : "Checkpoint câu hỏi"}
      </Button>

      {open && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
          {isLoading ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải...
            </p>
          ) : (
            <>
              {items?.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Video này chưa có checkpoint nào.
                </p>
              )}
              <ul className="space-y-1.5">
                {(items ?? []).map((record) => (
                  <li
                    key={record.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-background p-2 text-xs"
                  >
                    <span className="shrink-0 rounded bg-blue-500/10 px-1.5 py-0.5 font-mono font-semibold text-blue-600">
                      {formatTime(record.timestampMs)}
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">
                      {record.type.replaceAll("_", " ")}
                    </span>
                    <span className="truncate text-foreground">
                      {describe(record)}
                    </span>
                    {isQuestion(record) && (
                      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                        tua lại{" "}
                        {typeof record.content.rewindSeconds === "number"
                          ? record.content.rewindSeconds === 0
                            ? "tắt"
                            : `${record.content.rewindSeconds}s`
                          : "20s"}
                      </span>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className={isQuestion(record) ? "" : "ml-auto"}
                      aria-label="Sửa checkpoint"
                      onClick={() => startEdit(record)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      aria-label="Xóa checkpoint"
                      onClick={() => void handleDelete(record)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>

              {!form && !jsonForm && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={(items?.length ?? 0) >= 20}
                  onClick={startCreate}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Thêm checkpoint
                </Button>
              )}
            </>
          )}

          {form && (
            <fieldset className="space-y-3 rounded-md border border-blue-500/30 bg-background p-3">
              <div className="flex items-center justify-between">
                <legend className="text-xs font-semibold">
                  {form.id ? "Sửa checkpoint" : "Checkpoint mới"}
                </legend>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Đóng"
                  onClick={() => setForm(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <AuthoringLanguageToggle
                value={language}
                onChange={changeLanguage}
                disabled={isSaving}
              />
              <div className="grid min-w-0 gap-2 sm:grid-cols-[160px_minmax(0,1fr)]">
                <div className="space-y-1 text-xs text-muted-foreground">
                  <label className="block">
                    Hiện câu hỏi ở giây thứ
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={form.timestamp}
                      onChange={(event) =>
                        patchForm({ timestamp: event.target.value })
                      }
                      className={`${inputClass} mt-1`}
                    />
                  </label>
                </div>
                <label className="text-xs text-muted-foreground">
                  Câu hỏi
                  <input
                    value={form.question}
                    onChange={(event) =>
                      patchForm({ question: event.target.value })
                    }
                    className={`${inputClass} mt-1`}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Mốc checkpoint lấy từ thanh thời gian của video phía trên: {formatTime(Math.round(Number(selectedTime || 0) * 1000))}.
              </p>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Các lựa chọn (chọn nút tròn ở đáp án đúng)
                </p>
                {form.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${videoId}`}
                      checked={form.correctIndex === index}
                      onChange={() => patchForm({ correctIndex: index })}
                      aria-label={`Đáp án đúng ${index + 1}`}
                    />
                    <input
                      value={option}
                      onChange={(event) =>
                        patchForm({
                          options: form.options.map((value, optionIndex) =>
                            optionIndex === index ? event.target.value : value,
                          ),
                        })
                      }
                      placeholder={`Lựa chọn ${index + 1}`}
                      className={inputClass}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={form.options.length <= 2}
                      aria-label="Xóa lựa chọn"
                      onClick={() =>
                        patchForm({
                          options: form.options.filter(
                            (_, optionIndex) => optionIndex !== index,
                          ),
                          correctIndex:
                            form.correctIndex === index
                              ? 0
                              : form.correctIndex > index
                                ? form.correctIndex - 1
                                : form.correctIndex,
                        })
                      }
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {form.options.length < 6 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      patchForm({ options: [...form.options, ""] })
                    }
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Thêm lựa chọn
                  </Button>
                )}
              </div>
              <label className="block text-xs text-muted-foreground">
                Giải thích sau khi trả lời (tùy chọn)
                <textarea
                  rows={2}
                  value={form.explanation}
                  onChange={(event) =>
                    patchForm({ explanation: event.target.value })
                  }
                  className={`${inputClass} mt-1`}
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-muted-foreground">
                  Khi sai, &quot;Xem lại&quot; tua về trước mốc (giây)
                  <input
                    type="number"
                    min="0"
                    max="3600"
                    step="1"
                    value={form.rewindSeconds}
                    onChange={(event) =>
                      patchForm({ rewindSeconds: event.target.value })
                    }
                    className={`${inputClass} mt-1`}
                  />
                  <span className="mt-0.5 block text-[10px]">
                    0 = ẩn nút xem lại video.
                  </span>
                </label>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Bản dịch sang ngôn ngữ còn lại được tạo lại tự động mỗi lần lưu.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => void handleSaveQuestion()}
                  className="bg-blue-600 text-white"
                >
                  {isSaving && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                  Lưu checkpoint
                </Button>
              </div>
            </fieldset>
          )}

          {jsonForm && (
            <fieldset className="space-y-2 rounded-md border border-blue-500/30 bg-background p-3">
              <legend className="text-xs font-semibold">
                Sửa hoạt động {jsonForm.type.replaceAll("_", " ")}
              </legend>
              <div className="space-y-1 text-xs text-muted-foreground">
                <label className="block">
                  Thời điểm (giây)
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={jsonForm.timestamp}
                    onChange={(event) =>
                      setJsonForm({
                        ...jsonForm,
                        timestamp: event.target.value,
                      })
                    }
                    className={`${inputClass} mt-1`}
                  />
                </label>
              </div>
              <label className="block text-xs text-muted-foreground">
                Nội dung JSON
                <textarea
                  rows={10}
                  spellCheck={false}
                  value={jsonForm.content}
                  onChange={(event) =>
                    setJsonForm({ ...jsonForm, content: event.target.value })
                  }
                  className={`${inputClass} mt-1 font-mono text-xs`}
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setJsonForm(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => void handleSaveJson()}
                  className="bg-blue-600 text-white"
                >
                  {isSaving && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                  Lưu
                </Button>
              </div>
            </fieldset>
          )}
        </div>
      )}
    </div>
  );
}
