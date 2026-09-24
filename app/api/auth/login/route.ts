import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { authenticateUser } from "@/lib/auth/authenticate";
import {
  ApiError,
  assertMethod,
  checkRateLimit,
  getClientIp,
  handleRouteError,
  jsonOk,
  throwIfAborted,
} from "@/lib/api";
import { parseLoginBody } from "@/lib/validations/login";
import * as Yup from "yup";

export const runtime = "nodejs";

const LOGIN_RATE_LIMIT = {
  limit: 10,
  windowMs: 15 * 60 * 1000,
};

type LoginSuccess = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export async function POST(request: Request) {
  try {
    assertMethod(request, ["POST"]);
    throwIfAborted(request.signal);

    const ip = getClientIp(request);
    const rate = checkRateLimit(`login:${ip}`, LOGIN_RATE_LIMIT);

    if (!rate.allowed) {
      throw new ApiError(
        "TOO_MANY_REQUESTS",
        "Too many login attempts. Please try again later.",
        429,
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new ApiError("VALIDATION_ERROR", "Invalid JSON body.", 400);
    }

    throwIfAborted(request.signal);

    let input;

    try {
      input = await parseLoginBody(body);
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        throw new ApiError(
          "VALIDATION_ERROR",
          "Please check the submitted values.",
          400,
          error.inner.map((item) => ({
            path: item.path,
            message: item.message,
          })),
        );
      }
      throw error;
    }

    throwIfAborted(request.signal);

    const user = await authenticateUser(
      input.email,
      input.password,
      request.signal,
    );

    if (!user) {
      throw new ApiError(
        "INVALID_CREDENTIALS",
        "Invalid email or password.",
        401,
      );
    }

    throwIfAborted(request.signal);

    try {
      await signIn("credentials", {
        email: input.email,
        password: input.password,
        redirect: false,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        throw new ApiError(
          "INVALID_CREDENTIALS",
          "Invalid email or password.",
          401,
        );
      }
      throw error;
    }

    throwIfAborted(request.signal);

    return jsonOk<LoginSuccess>(
      { user },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET() {
  return handleRouteError(
    new ApiError("METHOD_NOT_ALLOWED", "Method GET is not allowed.", 405),
    { Allow: "POST" },
  );
}

export async function PUT() {
  return handleRouteError(
    new ApiError("METHOD_NOT_ALLOWED", "Method PUT is not allowed.", 405),
    { Allow: "POST" },
  );
}

export async function PATCH() {
  return handleRouteError(
    new ApiError("METHOD_NOT_ALLOWED", "Method PATCH is not allowed.", 405),
    { Allow: "POST" },
  );
}

export async function DELETE() {
  return handleRouteError(
    new ApiError("METHOD_NOT_ALLOWED", "Method DELETE is not allowed.", 405),
    { Allow: "POST" },
  );
}
