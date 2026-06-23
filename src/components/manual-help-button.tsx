"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { BookOpen, X } from "lucide-react";

type ManualTopic = "register" | "organize" | "collection" | "ai" | "plan";
type ResizeCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type ManualStep = {
  title: string;
  paragraphs: string[];
};

type ManualSection = {
  id: ManualTopic;
  title: string;
  description: string;
  steps: ManualStep[];
};

const manualSections: Record<ManualTopic, ManualSection> = {
  register: {
    id: "register",
    title: "新規投稿",
    description: "SNSで見つけた投稿URLをPostfolioに登録する手順です。",
    steps: [
      {
        title: "STEP 1",
        paragraphs: [
          "ヘッダーの「保存アイテム」を開き、絞り込みの下にある「新規作成」を押します。",
          "URL入力用のポップアップが表示されます。",
        ],
      },
      {
        title: "STEP 2",
        paragraphs: [
          "元のSNS投稿ページからURLをコピーし、PostfolioのURL欄に貼り付けます。",
          "必要ならコレクションやタグも入力します。",
        ],
      },
      {
        title: "STEP 3",
        paragraphs: [
          "保存後は投稿詳細ページで画像、投稿者、投稿日などが取れているか確認します。",
          "不足があれば「SNS情報を再取得」を試します。",
        ],
      },
    ],
  },
  organize: {
    id: "organize",
    title: "投稿の管理",
    description: "保存した投稿を検索、分類、タグ付け、まとめて操作する手順です。",
    steps: [
      {
        title: "STEP 1",
        paragraphs: [
          "検索バーでタイトル、メモ、URLが検索可能です。",
          "各種SNSボタンで表示するメディアを選択できます。コレクションやタグでも絞り込みできます。",
        ],
      },
      {
        title: "STEP 2",
        paragraphs: [
          "コレクションページで新しい分類を作成可能です。",
          "投稿詳細のリサーチメモから所属先を変更すると、コレクション内でも投稿内容を確認できます。",
        ],
      },
      {
        title: "STEP 3",
        paragraphs: [
          "投稿詳細のリサーチメモでタグを編集できます。",
          "複数選択からまとめてタグ付けもできますので、タグの先頭に#を付ける必要はありません。",
        ],
      },
      {
        title: "STEP 4",
        paragraphs: [
          "投稿カード左上のチェックで複数選択モードに入ります。",
          "下部のメニューから操作内容を選択、削除やAI分析は確認ポップアップで確認すると確定します。",
        ],
      },
    ],
  },
  collection: {
    id: "collection",
    title: "コレクション",
    description: "保存した投稿を分類ごとにまとめて確認する手順です。",
    steps: [
      {
        title: "STEP 1",
        paragraphs: [
          "「新規コレクション」から、分類名や説明を入力してコレクションを作成できます。",
          "企画、参考資料、ジャンル別など、あとで見返しやすい単位で作るのがおすすめです。",
        ],
      },
      {
        title: "STEP 2",
        paragraphs: [
          "コレクションカードを選択すると、その分類に登録した投稿を一覧で確認できます。",
          "投稿のサムネイルを選ぶと、同じ画面内で投稿内容やリサーチメモ、AI分析を確認できます。",
        ],
      },
      {
        title: "STEP 3",
        paragraphs: [
          "投稿詳細のリサーチメモから、所属コレクションを変更できます。",
          "不要になったコレクションは編集メニューから削除できます。中の投稿は未分類へ移動します。",
        ],
      },
    ],
  },
  ai: {
    id: "ai",
    title: "AI分析",
    description: "保存した投稿をAIで分析し、企画や再利用の参考にする手順です。",
    steps: [
      {
        title: "STEP 1",
        paragraphs: [
          "投稿詳細ページのAI分析欄から、AI分析を実行できます。",
          "確認ポップアップで実行を確定すると、投稿概要や評価、再利用アイデアが表示されます。",
        ],
      },
      {
        title: "STEP 2",
        paragraphs: [
          "AI分析では、投稿概要、コンテンツの切り口、投稿の評価を確認できます。",
          "「再利用するなら？」では、具体的な再利用アイデアを箇条書きで確認できます。",
        ],
      },
      {
        title: "STEP 3",
        paragraphs: [
          "保存アイテムやコレクションで複数の投稿を選択すると、まとめてAI分析できます。",
          "選択した投稿ごとにAI分析回数を消費します。",
        ],
      },
    ],
  },
  plan: {
    id: "plan",
    title: "プラン",
    description: "現在の利用状況やプラン変更、契約状況を確認する手順です。",
    steps: [
      {
        title: "STEP 1",
        paragraphs: [
          "ホーム画面で現在のプラン、保存枠、AI分析回数を確認できます。",
          "保存枠は現在保存している投稿数で消費します。",
        ],
      },
      {
        title: "STEP 2",
        paragraphs: [
          "プラン一覧ページから、Free、Pro、Creatorの内容を確認できます。",
          "変更したいプランのボタンを押すと、支払い画面に進みます。",
        ],
      },
      {
        title: "STEP 3",
        paragraphs: [
          "設定画面では、現在のプランや契約状況を確認できます。",
          "支払い方法や契約変更は、連携している決済画面から管理します。",
        ],
      },
    ],
  },
};

export function ManualHelpButton({
  topics,
  label = "マニュアル",
  className = "button-secondary px-3.5 py-2.5 text-sm",
}: {
  topics: ManualTopic[];
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<ManualTopic>(topics[0]);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });
  const resizeRef = useRef({
    resizing: false,
    corner: null as ResizeCorner | null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0,
  });
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const sections = useMemo(
    () => topics.map((topic) => manualSections[topic]),
    [topics],
  );
  const activeSection =
    sections.find((section) => section.id === activeTopic) ?? sections[0];

  useEffect(() => {
    if (!open) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 640;
    const panelWidth = isMobile ? width : Math.min(470, width - 48);
    const panelHeight = isMobile ? height : Math.min(680, height - 48);

    setPosition({
      x: isMobile ? 0 : width - panelWidth - 24,
      y: isMobile ? 0 : Math.max(24, height - panelHeight - 24),
    });
    setSize({ width: panelWidth, height: panelHeight });
  }, [open]);

  useEffect(() => {
    if (!open || window.innerWidth >= 640) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function stopDragging() {
      dragRef.current.dragging = false;
      resizeRef.current.resizing = false;
    }

    function movePanel(event: PointerEvent) {
      const activeResizeCorner = resizeRef.current.corner;
      if (resizeRef.current.resizing && activeResizeCorner) {
        const minWidth = 360;
        const minHeight = 260;
        const padding = 8;
        const resize = resizeRef.current;
        const deltaX = event.clientX - resize.startX;
        const deltaY = event.clientY - resize.startY;
        const affectsLeft = activeResizeCorner.includes("left");
        const affectsTop = activeResizeCorner.includes("top");

        let nextWidth = affectsLeft
          ? resize.startWidth - deltaX
          : resize.startWidth + deltaX;
        let nextHeight = affectsTop
          ? resize.startHeight - deltaY
          : resize.startHeight + deltaY;

        nextWidth = Math.min(
          Math.max(minWidth, nextWidth),
          window.innerWidth - padding * 2,
        );
        nextHeight = Math.min(
          Math.max(minHeight, nextHeight),
          window.innerHeight - padding * 2,
        );

        let nextX = affectsLeft
          ? resize.startLeft + (resize.startWidth - nextWidth)
          : resize.startLeft;
        let nextY = affectsTop
          ? resize.startTop + (resize.startHeight - nextHeight)
          : resize.startTop;

        nextX = Math.min(
          Math.max(padding, nextX),
          window.innerWidth - nextWidth - padding,
        );
        nextY = Math.min(
          Math.max(padding, nextY),
          window.innerHeight - nextHeight - padding,
        );

        setPosition({ x: nextX, y: nextY });
        setSize({ width: nextWidth, height: nextHeight });
        return;
      }

      if (!dragRef.current.dragging) return;

      const panel = panelRef.current;
      const panelWidth = panel?.offsetWidth ?? 360;
      const panelHeight = panel?.offsetHeight ?? 240;
      const padding = 8;
      const maxX = Math.max(padding, window.innerWidth - panelWidth - padding);
      const maxY = Math.max(padding, window.innerHeight - panelHeight - padding);

      setPosition({
        x: Math.min(Math.max(padding, event.clientX - dragRef.current.offsetX), maxX),
        y: Math.min(Math.max(padding, event.clientY - dragRef.current.offsetY), maxY),
      });
    }

    window.addEventListener("pointermove", movePanel);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", movePanel);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [open]);

  function startDragging(event: ReactPointerEvent<HTMLDivElement>) {
    if (window.innerWidth < 640) return;
    if ((event.target as HTMLElement).closest("button")) return;
    event.preventDefault();

    const rect = event.currentTarget
      .closest("[data-manual-panel]")
      ?.getBoundingClientRect();
    if (!rect) return;

    dragRef.current = {
      dragging: true,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
  }

  function startResizing(
    event: ReactPointerEvent<HTMLButtonElement>,
    corner: ResizeCorner,
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (window.innerWidth < 640) return;

    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;

    resizeRef.current = {
      resizing: true,
      corner,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      startLeft: rect.left,
      startTop: rect.top,
    };
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <BookOpen size={16} />
        {label}
      </button>

      {open && typeof document !== "undefined" ? createPortal(
        <div
          ref={panelRef}
          data-manual-panel
          className="fixed z-[120] h-dvh w-screen sm:z-[120] sm:h-auto sm:w-[min(29.375rem,calc(100vw-3rem))] sm:max-w-none"
          style={{
            left: position ? `${position.x}px` : undefined,
            top: position ? `${position.y}px` : undefined,
            right: position ? "auto" : "1rem",
            bottom: position ? "auto" : "1rem",
            width: size ? `${size.width}px` : undefined,
            height: size ? `${size.height}px` : undefined,
          }}
        >
          <div
            className="card flex h-full w-full flex-col overflow-hidden rounded-none border-0 border-slate-200 shadow-2xl sm:max-h-[78vh] sm:rounded-[var(--radius-card)] sm:border"
            role="dialog"
            aria-modal="false"
            aria-labelledby="manual-help-title"
          >
            <div
              className="flex select-none items-start justify-between gap-3 border-b border-slate-100 p-3 sm:cursor-move sm:touch-none sm:gap-4 sm:p-5"
              onPointerDown={startDragging}
            >
              <div>
                <p className="text-[10px] font-black tracking-[0.18em] text-[var(--primary)] uppercase sm:text-xs">
                  Help
                </p>
                <h2 id="manual-help-title" className="mt-0.5 text-base font-bold sm:mt-1 sm:text-xl">
                  {activeSection.title}
                </h2>
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-500 sm:mt-1 sm:text-sm sm:leading-6">
                  {activeSection.description}
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:p-2"
                aria-label="閉じる"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {sections.length > 1 ? (
              <div className="grid grid-cols-2 gap-1 border-b border-slate-100 p-1.5 sm:gap-2 sm:p-3">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    className={`rounded-xl px-2 py-1.5 text-[11px] font-bold transition sm:rounded-2xl sm:px-3 sm:py-2.5 sm:text-sm ${
                      section.id === activeSection.id
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-slate-50 text-slate-500 hover:bg-[var(--accent-soft)] hover:text-[var(--primary-dark)]"
                    }`}
                    onClick={() => setActiveTopic(section.id)}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="min-h-0 flex-1 space-y-1.5 overflow-hidden p-2 sm:space-y-4 sm:overflow-y-auto sm:p-5">
              {activeSection.steps.map((step) => (
                <section
                  key={step.title}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-2 sm:rounded-2xl sm:p-4"
                >
                  <h3 className="text-[13px] font-black text-[var(--primary)] sm:text-lg">
                    {step.title}
                  </h3>
                  <div className="mt-1 space-y-0.5 text-[10.5px] leading-4 text-slate-600 sm:mt-2 sm:space-y-2 sm:text-sm sm:leading-7">
                    {step.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
          <ResizeHandle
            corner="top-left"
            className="-top-2 -left-2 cursor-nwse-resize"
            onPointerDown={startResizing}
          />
          <ResizeHandle
            corner="top-right"
            className="-top-2 -right-2 cursor-nesw-resize"
            onPointerDown={startResizing}
          />
          <ResizeHandle
            corner="bottom-left"
            className="-bottom-2 -left-2 cursor-nesw-resize"
            onPointerDown={startResizing}
          />
          <ResizeHandle
            corner="bottom-right"
            className="-right-2 -bottom-2 cursor-nwse-resize"
            onPointerDown={startResizing}
          />
        </div>,
        document.body,
      ) : null}
    </>
  );
}

function ResizeHandle({
  corner,
  className,
  onPointerDown,
}: {
  corner: ResizeCorner;
  className: string;
  onPointerDown: (
    event: ReactPointerEvent<HTMLButtonElement>,
    corner: ResizeCorner,
  ) => void;
}) {
  return (
    <button
      type="button"
      aria-label="マニュアルの大きさを変更"
      className={`absolute hidden size-6 touch-none bg-transparent opacity-0 sm:block ${className}`}
      onPointerDown={(event) => onPointerDown(event, corner)}
    />
  );
}
