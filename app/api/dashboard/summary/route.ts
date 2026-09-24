import { auth } from "@/auth";
import {
  ApiError,
  assertMethod,
  handleRouteError,
  jsonOk,
  throwIfAborted,
} from "@/lib/api";
import { parseAccessActor } from "@/lib/auth/access";
import { getDashboardSummary } from "@/lib/services/dashboard";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    assertMethod(request, ["GET"]);
    throwIfAborted(request.signal);

    const session = await auth();
    const actor = session?.user ? parseAccessActor(session.user) : null;
    if (!actor) {
      throw new ApiError("UNAUTHORIZED", "You must be signed in.", 401);
    }

    throwIfAborted(request.signal);

    const summary = await getDashboardSummary(actor, request.signal);

    return jsonOk(summary, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST() {
  return handleRouteError(
    new ApiError("METHOD_NOT_ALLOWED", "Method POST is not allowed.", 405),
    { Allow: "GET" },
  );
}

export async function PUT() {
  return handleRouteError(
    new ApiError("METHOD_NOT_ALLOWED", "Method PUT is not allowed.", 405),
    { Allow: "GET" },
  );
}

export async function PATCH() {
  return handleRouteError(
    new ApiError("METHOD_NOT_ALLOWED", "Method PATCH is not allowed.", 405),
    { Allow: "GET" },
  );
}

export async function DELETE() {
  return handleRouteError(
    new ApiError("METHOD_NOT_ALLOWED", "Method DELETE is not allowed.", 405),
    { Allow: "GET" },
  );
}
