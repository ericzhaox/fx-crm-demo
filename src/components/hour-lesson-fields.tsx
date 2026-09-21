"use client";

import * as React from "react";
import { Star, Upload } from "lucide-react";
import { Field } from "@/components/field";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const LESSON_MAX = 2000;

export function clipText(s?: string, n = 24) {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function readHourLesson(f: FormData) {
  const summary = String(f.get("summary") ?? "").trim();
  const perfRaw = String(f.get("performance") ?? "");
  const performance = perfRaw ? Number(perfRaw) : undefined;
  const attachmentName = String(f.get("attachmentName") ?? "").trim() || undefined;
  const homeworkNote = String(f.get("homeworkNote") ?? "").trim() || undefined;
  return { summary, performance, attachmentName, homeworkNote };
}

export function validateHourLesson(d: { summary: string; performance?: number }) {
  if (!d.summary) return "授课内容为必填";
  if (!d.performance || d.performance < 1 || d.performance > 5) return "请选择课堂表现（1–5 星）";
  return "";
}

export function StarRating({
  value = 0,
  onChange,
  size = 16,
}: {
  value?: number;
  onChange?: (n: number) => void;
  size?: number;
}) {
  const n = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <div
      className="inline-flex items-center gap-px"
      role={onChange ? "radiogroup" : "img"}
      aria-label={`课堂表现 ${n}/5`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const on = i <= n;
        const icon = (
          <Star
            size={size}
            fill="currentColor"
            strokeWidth={0}
            className={cn("shrink-0", on ? "text-[var(--label-camp)]" : "text-slate-300")}
          />
        );
        if (!onChange) return <span key={i} className="leading-none">{icon}</span>;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={n === i}
            aria-label={`${i}星`}
            onClick={() => onChange(i)}
            className="rounded-sm p-0.5 leading-none hover:scale-110"
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}

function CountedArea({
  value,
  onChange,
  required,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <Textarea
        value={value}
        required={required}
        maxLength={LESSON_MAX}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.slice(0, LESSON_MAX))}
        className="min-h-[88px]"
      />
      <div className="mt-1 text-right text-xs text-muted">{value.length}/{LESSON_MAX}</div>
    </div>
  );
}

export function HourLessonFields() {
  const [lesson, setLesson] = React.useState("");
  const [stars, setStars] = React.useState(0);
  const [file, setFile] = React.useState("");
  const [homework, setHomework] = React.useState("");
  const [drag, setDrag] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function takeFile(list: FileList | null) {
    const name = list?.[0]?.name;
    if (name) setFile(name);
  }

  return (
    <div>
      <input type="hidden" name="summary" value={lesson} />
      <input type="hidden" name="performance" value={stars || ""} />
      <input type="hidden" name="attachmentName" value={file} />
      <input type="hidden" name="homeworkNote" value={homework} />

      <Field label="授课内容 / Lesson summary *">
        <CountedArea value={lesson} onChange={setLesson} required placeholder="本节课讲了什么" />
      </Field>

      <Field label="课堂表现 (1-5星) *">
        <StarRating value={stars} onChange={setStars} size={22} />
      </Field>

      <Field label="课堂附件（选填）">
        <div
          className={cn(
            "flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center",
            drag ? "border-primary bg-blue-50" : "border-border bg-surface",
          )}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); takeFile(e.dataTransfer.files); }}
        >
          <Upload className="mb-2 h-6 w-6 text-muted" />
          {file ? (
            <p className="text-sm text-primary">{file}</p>
          ) : (
            <p className="text-sm text-muted">
              <span className="text-primary">选择文件上传</span> 或拖到此处
            </p>
          )}
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => takeFile(e.target.files)} />
        </div>
      </Field>

      <Field label="作业安排与老师备注（选填）">
        <CountedArea value={homework} onChange={setHomework} placeholder="选填" />
      </Field>
    </div>
  );
}
