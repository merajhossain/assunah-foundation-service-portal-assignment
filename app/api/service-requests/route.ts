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
import { parseServiceRequestQuery } from "@/lib/services/service-request-query";
import {
  createServiceRequest,
  getCreateServiceRequestOptions,
} from "@/lib/services/service-request-create";
import { getServiceRequestsList } from "@/lib/services/service-requests";
import { parseCreateServiceRequestBody } from "@/lib/validations/service-request";
import * as Yup from "yup";

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

    const url = new URL(request.url);
    if (url.searchParams.get("meta") === "create") {
      const options = await getCreateServiceRequestOptions(
        actor,
        request.signal,
      );
      return jsonOk(options, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const query = parseServiceRequestQuery(url.searchParams);
    const data = await getServiceRequestsList(actor, query, request.signal);

    return jsonOk(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertMethod(request, ["POST"]);
    throwIfAborted(request.signal);

    const session = await auth();
    const actor = session?.user ? parseAccessActor(session.user) : null;
    if (!actor) {
      throw new ApiError("UNAUTHORIZED", "You must be signed in.", 401);
    }

    assertMutationRateLimit("service-request:create", actor.id);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError("VALIDATION_ERROR", "Invalid JSON body.", 400);
    }

    throwIfAborted(request.signal);

    let input;
    try {
      input = await parseCreateServiceRequestBody(body);
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

    const created = await createServiceRequest(actor, input, request.signal);

    return jsonOk(created, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT() {
  return handleRouteError(
    new ApiError("METHOD_NOT_ALLOWED", "Method PUT is not allowed.", 405),
    { Allow: "GET, POST" },
  );
}

export async function PATCH() {
  return handleRouteError(
    new ApiError("METHOD_NOT_ALLOWED", "Method PATCH is not allowed.", 405),
    { Allow: "GET, POST" },
  );
}

export async function DELETE() {
  return handleRouteError(
    new ApiError("METHOD_NOT_ALLOWED", "Method DELETE is not allowed.", 405),
    { Allow: "GET, POST" },
  );
}
