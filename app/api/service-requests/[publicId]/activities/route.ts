import { auth } from "@/auth";
import {
  ApiError,
  assertMethod,
  handleRouteError,
  jsonOk,
  throwIfAborted,
} from "@/lib/api";
import { parseAccessActor } from "@/lib/auth/access";
import { getServiceRequestActivities } from "@/lib/services/service-request-detail";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ publicId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    assertMethod(request, ["GET"]);
    throwIfAborted(request.signal);

    const session = await auth();
    const actor = session?.user ? parseAccessActor(session.user) : null;
    if (!actor) {
      throw new ApiError("UNAUTHORIZED", "You must be signed in.", 401);
    }

    const { publicId } = await context.params;
    const cursorRaw = new URL(request.url).searchParams.get("cursor");
    const cursor = cursorRaw === null ? null : Number(cursorRaw);
    if (cursor !== null && (!Number.isInteger(cursor) || cursor <= 0)) {
      throw new ApiError("VALIDATION_ERROR", "Invalid cursor.", 400);
    }

    const data = await getServiceRequestActivities(
      actor,
      decodeURIComponent(publicId),
      cursor,
      request.signal,
    );

    return jsonOk(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
