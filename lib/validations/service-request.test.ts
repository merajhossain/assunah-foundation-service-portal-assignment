import { describe, expect, it } from "vitest";
import { ValidationError } from "yup";
import {
  parseCreateServiceRequestBody,
  parseUpdateServiceRequestBody,
} from "./service-request";

const validCreate = {
  subject: "  Winter blankets for Rahman family ",
  description: "Family of six needs blankets before the cold wave.",
  serviceId: "12",
  priority: "high",
  assigneeId: "",
};

describe("parseCreateServiceRequestBody", () => {
  it("trims text and coerces ids", async () => {
    await expect(parseCreateServiceRequestBody(validCreate)).resolves.toEqual({
      subject: "Winter blankets for Rahman family",
      description: "Family of six needs blankets before the cold wave.",
      serviceId: 12,
      priority: "high",
      assigneeId: null,
    });
  });

  it("strips unknown fields such as requesterId", async () => {
    const parsed = await parseCreateServiceRequestBody({
      ...validCreate,
      requesterId: 999,
      status: "closed",
    });
    expect(parsed).not.toHaveProperty("requesterId");
    expect(parsed).not.toHaveProperty("status");
  });

  it("reports every invalid field at once", async () => {
    const error = await parseCreateServiceRequestBody({
      subject: "ab",
      description: "short",
      serviceId: "",
      priority: "whenever",
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ValidationError);
    const paths = (error as ValidationError).inner.map((item) => item.path);
    expect(paths).toEqual(
      expect.arrayContaining(["subject", "description", "serviceId", "priority"]),
    );
  });
});

describe("parseUpdateServiceRequestBody", () => {
  const expectedUpdatedAt = "2026-09-20T10:15:30.123Z";

  it("normalizes an empty assignee to null and drops blank notes", async () => {
    await expect(
      parseUpdateServiceRequestBody({
        status: "in_progress",
        assigneeId: "",
        note: "   ",
        expectedUpdatedAt,
      }),
    ).resolves.toEqual({
      status: "in_progress",
      assigneeId: null,
      note: undefined,
      expectedUpdatedAt,
    });
  });

  it("requires expectedUpdatedAt for optimistic locking", async () => {
    await expect(
      parseUpdateServiceRequestBody({ status: "open", assigneeId: null }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects invalid dates and statuses", async () => {
    await expect(
      parseUpdateServiceRequestBody({
        status: "open",
        expectedUpdatedAt: "yesterday-ish",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      parseUpdateServiceRequestBody({ status: "archived", expectedUpdatedAt }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
