"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Image from "next/image";
import { ImageUp, Loader2, Send, X } from "lucide-react";

const maxAttachmentCount = 3;
const acceptedImageTypes = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".heic",
  ".heif",
].join(",");

type SelectedPreview = {
  file: File;
  name: string;
  url: string;
};

export function ContactForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFilesRef = useRef<SelectedPreview[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedPreview[]>([]);

  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  useEffect(() => {
    return () => {
      selectedFilesRef.current.forEach((file) => URL.revokeObjectURL(file.url));
    };
  }, []);

  function replaceSelectedFiles(files: File[]) {
    selectedFilesRef.current.forEach((file) => URL.revokeObjectURL(file.url));
    const nextFiles = files.map((file) => ({
      file,
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setSelectedFiles(nextFiles);
  }

  function clearSelectedFiles() {
    replaceSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    if (files.length > maxAttachmentCount) {
      setError(`画像は${maxAttachmentCount}枚まで添付できます。`);
    } else {
      setError("");
    }

    replaceSelectedFiles(files.slice(0, maxAttachmentCount));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    selectedFiles.forEach(({ file }) => {
      formData.append("attachments", file, file.name);
    });

    setMessage("");
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "送信に失敗しました。");
      }

      setMessage(result.message ?? "お問い合わせを送信しました。");
      form.reset();
      clearSelectedFiles();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "送信に失敗しました。しばらくしてから再度お試しください。",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mt-8 space-y-5 p-6 sm:p-8">
      <div>
        <h2 className="text-lg font-bold">お問い合わせフォーム</h2>
        <p className="mt-1 text-xs text-slate-500">
          <span className="text-red-500">*</span> は必須項目です。
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          お名前 <span className="text-red-500">*</span>
          <input
            name="name"
            required
            className="field mt-2"
            placeholder="例：山田 太郎"
          />
        </label>
        <label className="block text-sm font-bold">
          返信先メールアドレス <span className="text-red-500">*</span>
          <input
            name="replyTo"
            type="email"
            required
            className="field mt-2"
            placeholder="例：your@example.com"
          />
        </label>
      </div>

      <label className="block text-sm font-bold">
        件名 <span className="text-red-500">*</span>
        <input
          name="subject"
          required
          className="field mt-2"
          placeholder="例：不具合について"
        />
      </label>

      <label className="block text-sm font-bold">
        お問い合わせ内容 <span className="text-red-500">*</span>
        <textarea
          name="body"
          required
          className="field mt-2 min-h-48 resize-y"
          placeholder="お問い合わせ内容を入力してください"
        />
      </label>

      <div className="block text-sm font-bold">
        画像添付
        <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <ImageUp size={18} />
              </span>
              <div>
                <p className="font-bold text-slate-900">画像を選択</p>
                <p className="text-xs text-slate-500">
                  添付可能: jpg、jpeg、png、webp、gif、heic、heif
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedImageTypes}
                multiple
                onChange={handleFileChange}
                className="sr-only"
              />
              <button
                type="button"
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                onClick={() => fileInputRef.current?.click()}
              >
                ファイル選択
              </button>
            </div>
          </div>

          {selectedFiles.length ? (
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800">選択中の画像</p>
                  <ul className="mt-1 space-y-1">
                    {selectedFiles.map((file) => (
                      <li key={file.url} className="truncate">
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex shrink-0 items-start gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    {selectedFiles.map((file) => (
                      <Image
                        key={file.url}
                        src={file.url}
                        alt={file.name}
                        width={56}
                        height={56}
                        unoptimized
                        className="size-14 rounded-lg border border-slate-200 object-cover"
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    aria-label="選択中の画像を解除"
                    className="grid size-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                    onClick={clearSelectedFiles}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <p className="mt-3 text-xs leading-5 text-slate-500">
            画像は3枚まで添付できます。添付画像は1枚5MBまで、合計10MBまで送信できます。
          </p>
        </div>
      </div>

      {message ? (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSending}
        className="button-primary justify-center px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSending ? (
          <Loader2 size={17} className="animate-spin" />
        ) : (
          <Send size={17} />
        )}
        {isSending ? "送信中..." : "送信する"}
      </button>
    </form>
  );
}
