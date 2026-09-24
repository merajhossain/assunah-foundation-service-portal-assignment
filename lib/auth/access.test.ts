import { describe, expect, it } from "vitest";
import {
  ROLES,
  canAssignOnCreate,
  canCreateServiceRequest,
  canEditRequestFields,
  canRequesterEditRequest,
  canUpdateServiceRequestStatus,
  serviceRequestWhereForRole,
  serviceWhereForRole,
} from "./access";

describe("role permissions", () => {
  it("lets every known role create requests", () => {
    for (const role of Object.values(ROLES)) {
      expect(canCreateServiceRequest(role)).toBe(true);
    }
    expect(canCreateServiceRequest("guest")).toBe(false);
  });

  it("only lets staff assign on create or update requests", () => {
    expect(canAssignOnCreate(ROLES.REQUESTER)).toBe(false);
    expect(canUpdateServiceRequestStatus(ROLES.REQUESTER)).toBe(false);
    for (const role of [ROLES.ADMIN, ROLES.MANAGER, ROLES.OFFICE]) {
      expect(canAssignOnCreate(role)).toBe(true);
      expect(canUpdateServiceRequestStatus(role)).toBe(true);
    }
  });

  it("locks solved requests for everyone except admin", () => {
    expect(canEditRequestFields(ROLES.MANAGER, "open")).toBe(true);
    expect(canEditRequestFields(ROLES.MANAGER, "resolved")).toBe(false);
    expect(canEditRequestFields(ROLES.OFFICE, "closed")).toBe(false);
    expect(canEditRequestFields(ROLES.ADMIN, "closed")).toBe(true);
    expect(canEditRequestFields(ROLES.REQUESTER, "open")).toBe(false);
  });

  it("lets a requester edit their own request until it is solved", () => {
    const requester = { id: 4, role: ROLES.REQUESTER };
    expect(
      canRequesterEditRequest(requester, { requesterId: 4, status: "open" }),
    ).toBe(true);
    expect(
      canRequesterEditRequest(requester, {
        requesterId: 4,
        status: "in_progress",
      }),
    ).toBe(false);
    expect(
      canRequesterEditRequest(requester, { requesterId: 4, status: "resolved" }),
    ).toBe(false);
    expect(
      canRequesterEditRequest(requester, { requesterId: 9, status: "open" }),
    ).toBe(false);
    expect(
      canRequesterEditRequest(
        { id: 4, role: ROLES.ADMIN },
        { requesterId: 4, status: "open" },
      ),
    ).toBe(false);
  });
});

describe("row-level scoping", () => {
  it("gives admin the full queue", () => {
    expect(serviceRequestWhereForRole({ id: 1, role: ROLES.ADMIN })).toEqual({});
  });

  it("limits requesters to their own requests", () => {
    expect(serviceRequestWhereForRole({ id: 7, role: ROLES.REQUESTER })).toEqual({
      requesterId: 7,
    });
  });

  it("limits managers to assigned or previously touched requests", () => {
    expect(serviceRequestWhereForRole({ id: 3, role: ROLES.MANAGER })).toEqual({
      OR: [
        { assigneeId: 3 },
        { activities: { some: { actorId: 3 } } },
      ],
    });
  });

  it("returns nothing for unknown roles", () => {
    expect(serviceRequestWhereForRole({ id: 3, role: "guest" })).toEqual({ id: -1 });
    expect(serviceWhereForRole({ id: 3, role: "guest" })).toEqual({ id: -1 });
  });

  it("hides inactive services from requesters", () => {
    expect(serviceWhereForRole({ id: 3, role: ROLES.REQUESTER })).toEqual({
      isActive: true,
    });
  });
});
