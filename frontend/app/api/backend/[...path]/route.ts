import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, backendOrigin } from "@/lib/serverSession";
import { validBrowserRequest } from "@/lib/requestOrigin";
const VERIFICATION_COOKIE = "signup_verification";

export const runtime = "nodejs";

async function handle(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  if (
    path[0] !== "api" ||
    path.some(
      (segment) =>
        segment === "." ||
        segment === ".." ||
        /[\/\\?#\x00-\x1f]/.test(segment),
    )
  ) {
    return NextResponse.json({ error: "Invalid API path" }, { status: 400 });
  }
  if (
    !["GET", "HEAD"].includes(request.method) &&
    !validBrowserRequest(request, request.nextUrl.origin)
  ) {
    return NextResponse.json(
      {
        error: "Invalid request origin",
        code:
          request.headers.get("x-artistnation-request") === "1"
            ? "ORIGIN_CHECK_FAILED"
            : "REQUEST_HEADER_MISSING",
      },
      { status: 403 },
    );
  }
  const endpoint = "/" + path.join("/");
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (endpoint === "/api/session" && !token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (endpoint === "/api/verification" && request.method === "DELETE") {
    const response = NextResponse.json({ message: "Verification cleared" });
    response.cookies.delete(VERIFICATION_COOKIE);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  const pending = request.cookies.get(VERIFICATION_COOKIE)?.value;
  const headers = new Headers();
  if (endpoint === "/api/verification" && pending)
    headers.set("X-Verification-Token", pending);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  try {
    let body: ArrayBuffer | string | undefined = ["GET", "HEAD"].includes(
      request.method,
    )
      ? undefined
      : await request.arrayBuffer();
    if (["/api/verify-otp", "/api/resend-otp"].includes(endpoint)) {
      if (!pending)
        return NextResponse.json(
          { error: "Verification expired. Please sign in again." },
          { status: 403 },
        );
      let payload;
      try {
        payload = JSON.parse(new TextDecoder().decode(body as ArrayBuffer));
      } catch {
        return NextResponse.json(
          { error: "Invalid request body" },
          { status: 400 },
        );
      }
      body = JSON.stringify({ ...payload, verificationToken: pending });
      headers.set("Content-Type", "application/json");
    }
    const upstream = await fetch(
      `${backendOrigin()}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(150000),
      },
    );
    const type = upstream.headers.get("content-type") || "";
    let accessToken: string | undefined;
    let verificationToken: string | undefined;
    let response: NextResponse;
    if (type.includes("application/json")) {
      const data = await upstream.json();
      if (
        upstream.ok &&
        ["/api/login", "/api/verify-otp"].includes(endpoint) &&
        typeof data.token === "string"
      ) {
        accessToken = data.token;
        data.token = "session"; // The browser receives a status marker, never the credential.
      }
      if (
        ["/api/signup", "/api/login"].includes(endpoint) &&
        typeof data.verificationToken === "string"
      ) {
        verificationToken = data.verificationToken;
        delete data.verificationToken;
      }
      response = NextResponse.json(data, { status: upstream.status });
    } else {
      response = new NextResponse(await upstream.arrayBuffer(), {
        status: upstream.status,
        headers: { "Content-Type": type || "text/plain" },
      });
    }
    response.headers.set("Cache-Control", "no-store");
    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter) response.headers.set("Retry-After", retryAfter);
    if (accessToken)
      response.cookies.set(SESSION_COOKIE, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    if (
      (upstream.status === 401 &&
        !["/api/login", "/api/verification", "/api/verify-reset-otp"].includes(
          endpoint,
        )) ||
      (endpoint === "/api/logout" && upstream.ok)
    )
      response.cookies.delete(SESSION_COOKIE);
    if (endpoint === "/api/login" || accessToken || endpoint === "/api/logout")
      response.cookies.delete(VERIFICATION_COOKIE);
    if (verificationToken)
      response.cookies.set(VERIFICATION_COOKIE, verificationToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 60,
      });
    response.cookies.delete("authToken");
    return response;
  } catch {
    return NextResponse.json(
      { error: "The service is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
};
