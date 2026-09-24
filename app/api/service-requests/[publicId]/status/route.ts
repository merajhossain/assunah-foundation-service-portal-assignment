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
import { updateServiceRequest } from "@/lib/services/service-request-detail";
import { parseUpdateServiceRequestBody } from "@/lib/validations/service-request";
import * as Yup from "yup";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ publicId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertMethod(request, ["PATCH"]);
    throwIfAborted(request.signal);

    const session = await auth();
    const actor = session?.user ? parseAccessActor(session.user) : null;
    if (!actor) {
      throw new ApiError("UNAUTHORIZED", "You must be signed in.", 401);
    }

    assertMutationRateLimit("service-request:update", actor.id);

    const { publicId } = await context.params;
    const decoded = decodeURIComponent(publicId);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError("VALIDATION_ERROR", "Invalid JSON body.", 400);
    }

    throwIfAborted(request.signal);

    let input;
    try {
      input = await parseUpdateServiceRequestBody(body);
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

    const data = await updateServiceRequest(
      actor,
      decoded,
      input,
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

export async function GET() {
  return handleRouteError(
    new ApiError("METHOD_NOT_ALLOWED", "Method GET is not allowed.", 405),
    { Allow: "PATCH" },
  );
}
