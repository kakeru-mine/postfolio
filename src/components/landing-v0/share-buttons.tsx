const SHARE_TEXT =
  "Postfolio｜SNSで見つけた良い投稿を、次の企画につなげるリサーチ資産へ。";

function shareUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  return base ? `${base}/welcome` : "https://postfolio.app/welcome";
}

export function ShareButtons() {
  const url = shareUrl();
  // Distinct per-platform query params double as referral tracking and ensure
  // each platform crawls a fresh URL (so X re-fetches the current share card).
  const xUrl = `${url}?utm_source=x&utm_medium=share`;
  const threadsUrl = `${url}?utm_source=threads&utm_medium=share`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    SHARE_TEXT,
  )}&url=${encodeURIComponent(xUrl)}`;
  const threadsHref = `https://www.threads.net/intent/post?text=${encodeURIComponent(
    `${SHARE_TEXT}\n${threadsUrl}`,
  )}`;

  return (
    <div>
      <h3 className="text-sm font-semibold text-white">シェア</h3>
      <div className="mt-3 flex items-start gap-4">
        <a
          href={xHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Xでシェア"
          className="group flex flex-col items-center gap-1.5"
        >
          <span className="rounded-2xl bg-white p-1 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md">
            <span className="grid size-9 place-items-center rounded-xl bg-[#0f172a] text-white">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </span>
          </span>
          <span className="text-xs font-medium text-white/85">X</span>
        </a>
        <a
          href={threadsHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Threadsでシェア"
          className="group flex flex-col items-center gap-1.5"
        >
          <span className="rounded-2xl bg-white p-1 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md">
            <span className="grid size-9 place-items-center rounded-xl bg-[#0f172a] text-white">
              <svg viewBox="0 0 192 192" width="19" height="19" fill="currentColor" aria-hidden="true">
                <path d="M141.5 88.4c-.7-.3-1.4-.6-2.1-.9-1.2-22.8-13.7-35.9-34.7-36-9.5-.1-17.5 2.4-23.5 7.5l9.9 11.1c4.3-3.6 9.5-4.6 14-4.6 5.7.1 10 1.7 12.7 4.9 2 2.3 3.3 5.5 4 9.5-5.2-.9-10.8-1.2-16.8-.8-16.9 1-27.8 10.8-27 24.5.4 6.9 3.8 12.9 9.7 16.8 5 3.3 11.4 4.9 18.1 4.5 8.9-.5 15.8-3.9 20.7-10.1 3.7-4.7 6.1-10.8 7.1-18.5 4.1 2.5 7.2 5.8 8.9 9.8 2.9 6.8 3 18-6.1 27.1-8 8-17.6 11.4-32.1 11.5-16.1-.1-28.2-5.3-36-15.4-7.3-9.5-11.1-23.2-11.2-40.7.1-17.5 3.9-31.2 11.2-40.7 7.8-10.1 19.9-15.3 36-15.4 16.2.1 28.5 5.3 36.6 15.5 4 5 7 11.3 9 18.7l15.5-4.1c-2.4-9.1-6.2-16.9-11.4-23.5-10.4-13.1-25.6-19.8-45.2-20h-.1c-19.6.2-34.6 7-44.7 20.1C24.3 50.9 19.4 67.8 19.3 89v.1c.1 21.3 5 38.2 14.6 50.3 10.1 13.1 25.1 19.9 44.7 20.1h.1c17.4-.1 29.7-4.7 39.8-14.8 13.3-13.2 12.9-29.8 8.5-40-3.2-7.3-9.2-13.3-17.5-17.3zm-37.4 26.6c-7.4.4-15.1-2.9-15.5-10-.3-5.3 3.8-11.2 16-11.9 1.4-.1 2.7-.1 4-.1 4.4 0 8.6.4 12.3 1.3-1.4 17.2-9.5 20.4-16.8 20.7z" />
              </svg>
            </span>
          </span>
          <span className="text-xs font-medium text-white/85">Threads</span>
        </a>
      </div>
    </div>
  );
}
