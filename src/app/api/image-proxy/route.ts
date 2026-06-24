import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = [
  /\.fbcdn\.net$/,
  /\.cdninstagram\.com$/,
  /\.instagram\.com$/,
  /\.threads\.net$/,
];

function isAllowedHost(url: URL) {
  return ALLOWED_HOSTS.some((pattern) => pattern.test(url.hostname));
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse("Invalid url parameter", { status: 400 });
  }

  if (target.protocol !== "https:" || !isAllowedHost(target)) {
    return new NextResponse("URL not allowed", { status: 403 });
  }

  try {
    const response = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.threads.net/",
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      return new NextResponse("Upstream error", { status: response.status });
    }

    const contentType =
      response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Not an image", { status: 502 });
    }

    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Length": String(body.byteLength),
      },
    });
  } catch {
    return new NextResponse("Proxy fetch failed", { status: 502 });
  }
}
