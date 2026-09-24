import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  hasServiceRequestFilters,
  parseServiceRequestQuery,
  toServiceRequestSearchParams,
} from "./service-request-query";

describe("parseServiceRequestQuery", () => {
  it("reads filters from URLSearchParams and trims blanks", () => {
    const query = parseServiceRequestQuery(
      new URLSearchParams("q=%20food%20&status=open&category=&sort=priority"),
    );
    expect(query).toMatchObject({
      q: "food",
      status: "open",
      category: undefined,
      sort: "priority",
    });
  });

  it("uses the first value when a key is repeated", () => {
    expect(parseServiceRequestQuery({ status: ["closed", "open"] }).status).toBe(
      "closed",
    );
  });

  it("ignores unknown sorts", () => {
    expect(parseServiceRequestQuery({ sort: "DROP TABLE" }).sort).toBeUndefined();
  });

  it("accepts only positive integer pages above 1", () => {
    expect(parseServiceRequestQuery({ page: "3" }).page).toBe(3);
    expect(parseServiceRequestQuery({ page: "1" }).page).toBeUndefined();
    expect(parseServiceRequestQuery({ page: "0" }).page).toBeUndefined();
    expect(parseServiceRequestQuery({ page: "-2" }).page).toBeUndefined();
    expect(parseServiceRequestQuery({ page: "2.5" }).page).toBeUndefined();
    expect(parseServiceRequestQuery({ page: "abc" }).page).toBeUndefined();
  });

  it("whitelists page sizes", () => {
    expect(parseServiceRequestQuery({ pageSize: "50" }).pageSize).toBe(50);
    expect(parseServiceRequestQuery({ pageSize: "10000" }).pageSize).toBeUndefined();
    expect(
      parseServiceRequestQuery({ pageSize: String(DEFAULT_PAGE_SIZE) }).pageSize,
    ).toBeUndefined();
  });

  it("caps very long search terms", () => {
    const query = parseServiceRequestQuery({ q: "x".repeat(500) });
    expect(query.q).toHaveLength(200);
  });
});

describe("toServiceRequestSearchParams", () => {
  it("omits defaults so URLs stay short", () => {
    const params = toServiceRequestSearchParams({
      sort: "updated",
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
    expect(params.toString()).toBe("");
  });

  it("round-trips through the parser", () => {
    const original = {
      q: "winter",
      status: "in_progress",
      assignee: "unassigned",
      sort: "subject" as const,
      page: 4,
      pageSize: 50,
    };
    const parsed = parseServiceRequestQuery(toServiceRequestSearchParams(original));
    expect(parsed).toMatchObject(original);
  });
});

describe("hasServiceRequestFilters", () => {
  it("does not treat pagination as a filter", () => {
    expect(hasServiceRequestFilters({ page: 3, pageSize: 50 })).toBe(false);
    expect(hasServiceRequestFilters({ priority: "urgent" })).toBe(true);
  });
});
