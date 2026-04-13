import { fetchAction } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";

type CookieConfig = {
  maxAge: number | null;
};

type ConvexAuthAction = "auth:signIn" | "auth:signOut";

function isLocalHost(host: string) {
  return /(localhost|127\.0\.0\.1):\d+/.test(host);
}

function isCorsRequest(request: NextRequest) {
  const origin = request.headers.get("Origin");
  const originURL = origin ? new URL(origin) : null;
  const host = request.headers.get("Host") ?? "";
  return (
    originURL !== null &&
    (originURL.host !== host || originURL.protocol !== new URL(request.url).protocol)
  );
}

function getCookieNames(request: NextRequest) {
  const host = request.headers.get("Host") ?? "";
  const prefix = isLocalHost(host) ? "" : "__Host-";
  return {
    token: `${prefix}__convexAuthJWT`,
    refreshToken: `${prefix}__convexAuthRefreshToken`,
    verifier: `${prefix}__convexAuthOAuthVerifier`,
  };
}

function getCookieOptions(cookieConfig: CookieConfig, request: NextRequest) {
  const host = request.headers.get("Host") ?? "";
  return {
    secure: isLocalHost(host) ? false : true,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: cookieConfig.maxAge ?? undefined,
  };
}

type ResponseCookieStore = {
  set: (
    name: string,
    value: string,
    options?: Parameters<NextResponse["cookies"]["set"]>[2],
  ) => unknown;
};

function setCookieValue(
  responseCookies: ResponseCookieStore,
  name: string,
  value: string | null,
  options: ReturnType<typeof getCookieOptions>,
) {
  if (value === null) {
    responseCookies.set(name, "", {
      ...options,
      maxAge: undefined,
      expires: new Date(0),
    });
  } else {
    responseCookies.set(name, value, options);
  }
}

function setAuthCookies(
  response: NextResponse,
  request: NextRequest,
  tokens: { token: string; refreshToken: string } | null,
  cookieConfig: CookieConfig,
) {
  const names = getCookieNames(request);
  const options = getCookieOptions(cookieConfig, request);
  const responseCookies = response.cookies;

  if (tokens === null) {
    setCookieValue(responseCookies, names.token, null, options);
    setCookieValue(responseCookies, names.refreshToken, null, options);
  } else {
    setCookieValue(responseCookies, names.token, tokens.token, options);
    setCookieValue(
      responseCookies,
      names.refreshToken,
      tokens.refreshToken,
      options,
    );
  }
}

function setVerifierCookie(
  response: NextResponse,
  request: NextRequest,
  verifier: string | null,
  cookieConfig: CookieConfig,
) {
  const names = getCookieNames(request);
  const options = getCookieOptions(cookieConfig, request);
  setCookieValue(response.cookies, names.verifier, verifier, options);
}

function clearAuthCookies(
  response: NextResponse,
  request: NextRequest,
  cookieConfig: CookieConfig,
) {
  setVerifierCookie(response, request, null, cookieConfig);
  setAuthCookies(response, request, null, cookieConfig);
}

function getRequestCookies(request: NextRequest) {
  const names = getCookieNames(request);
  return {
    token: request.cookies.get(names.token)?.value ?? null,
    refreshToken: request.cookies.get(names.refreshToken)?.value ?? null,
    verifier: request.cookies.get(names.verifier)?.value ?? null,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function getConvexNextjsOptions() {
  if (process.env.NEXT_PUBLIC_CONVEX_URL !== undefined) {
    return { url: process.env.NEXT_PUBLIC_CONVEX_URL };
  }
  return {};
}

export async function POST(request: NextRequest) {
  const cookieConfig: CookieConfig = { maxAge: null };

  if (request.method !== "POST") {
    return new Response("Invalid method", { status: 405 });
  }

  if (isCorsRequest(request)) {
    return new Response("Invalid origin", { status: 403 });
  }

  const body = (await request.json()) as {
    action?: ConvexAuthAction;
    args?: Record<string, unknown>;
  };
  const { action, args = {} } = body;
  if (action !== "auth:signIn" && action !== "auth:signOut") {
    return new Response("Invalid action", { status: 400 });
  }

  let token: string | undefined;
  if (action === "auth:signIn" && args.refreshToken !== undefined) {
    const refreshToken = getRequestCookies(request).refreshToken;
    if (refreshToken === null) {
      const response = jsonResponse({ tokens: null });
      clearAuthCookies(response, request, cookieConfig);
      return response;
    }
    args.refreshToken = refreshToken;
  } else {
    token = getRequestCookies(request).token ?? undefined;
  }

  if (action === "auth:signIn") {
    try {
      const fetchOptions =
        args.refreshToken !== undefined || (args.params as { code?: string } | undefined)?.code !== undefined
          ? {}
          : { token };
      const authArgs = args as { params?: Record<string, string>; refreshToken?: string; verifier?: string };
      const result = await fetchAction(api.auth.signIn, authArgs, {
        ...getConvexNextjsOptions(),
        ...fetchOptions,
      });

      if (result.redirect !== undefined) {
        const response = jsonResponse({ redirect: result.redirect });
        setVerifierCookie(response, request, (result.verifier ?? null) as string | null, cookieConfig);
        return response;
      }

      if (result.tokens !== undefined) {
        const response = jsonResponse({
          tokens:
            result.tokens !== null
              ? { token: result.tokens.token, refreshToken: "dummy" }
              : null,
        });
        setAuthCookies(response, request, result.tokens, cookieConfig);
        return response;
      }

      return jsonResponse(result);
    } catch (error) {
      const response = jsonResponse(
        { error: (error as Error).message },
        400,
      );
      clearAuthCookies(response, request, cookieConfig);
      return response;
    }
  }

  try {
    await fetchAction(api.auth.signOut, {}, {
      ...getConvexNextjsOptions(),
      token,
    });
  } catch {
    // Best effort clear on sign out failure.
  }
  const response = jsonResponse(null);
  clearAuthCookies(response, request, cookieConfig);
  return response;
}
