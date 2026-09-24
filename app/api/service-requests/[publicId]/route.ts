import { auth } from "@/auth";
import {
  ApiError,
  assertMethod,
  assertMutationRateLimit,
  handleRouteError,
  jsonOk,
  throwIfAborted,
} from "@/lib/api";
import { parseAccessActor } from "@/lib/auth/access";
import { getServiceRequestDetail } from "@/lib/services/service-request-detail";
import { updateRequesterServiceRequest } from "@/lib/services/service-request-edit";
import { parseEditRequesterRequestBody } from "@/lib/validations/service-request";

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
    const decoded = decodeURIComponent(publicId);

    throwIfAborted(request.signal);

    const data = await getServiceRequestDetail(
      actor,
      decoded,
      request.signal,
    );

    return jsonOk(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertMethod(request, ["PATCH"]);
    throwIfAborted(request.signal);

    const session = await auth();
    const actor = session?.user ? parseAccessActor(session.user) : null;
    if (!actor) {
      throw new ApiError("UNAUTHORIZED", "You must be signed in.", 401);
    }

    assertMutationRateLimit("service-request:edit", actor.id);

    const { publicId } = await context.params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError("VALIDATION_ERROR", "Request body must be JSON.", 400);
    }

    const input = await parseEditRequesterRequestBody(body);
    throwIfAborted(request.signal);

    const updated = await updateRequesterServiceRequest(
      actor,
      decodeURIComponent(publicId),
      input,
      request.signal,
    );

    return jsonOk(updated);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST() {
  return handleRouteError(
    new ApiError("METHOD_NOT_ALLOWED", "Method POST is not allowed.", 405),
    { Allow: "GET, PATCH" },
  );
}
