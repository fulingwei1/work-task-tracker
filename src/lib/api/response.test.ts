import { describe, it, expect } from "vitest";
import { parsePagination } from "@/lib/api/response";

describe("parsePagination", () => {
  it("should return default values when no params provided", () => {
    const params = new URLSearchParams();
    const result = parsePagination(params);

    expect(result).toEqual({
      page: 1,
      limit: 20,
      skip: 0,
    });
  });

  it("should parse page and limit from params", () => {
    const params = new URLSearchParams("page=3&limit=10");
    const result = parsePagination(params);

    expect(result).toEqual({
      page: 3,
      limit: 10,
      skip: 20,
    });
  });

  it("should enforce minimum page of 1", () => {
    const params = new URLSearchParams("page=-5");
    const result = parsePagination(params);

    expect(result.page).toBe(1);
  });

  it("should enforce minimum limit of 1", () => {
    const params = new URLSearchParams("limit=0");
    const result = parsePagination(params);

    expect(result.limit).toBe(1);
  });

  it("should enforce maximum limit", () => {
    const params = new URLSearchParams("limit=500");
    const result = parsePagination(params);

    expect(result.limit).toBe(100);
  });

  it("should use custom default limit", () => {
    const params = new URLSearchParams();
    const result = parsePagination(params, 50);

    expect(result.limit).toBe(50);
  });

  it("should use custom max limit", () => {
    const params = new URLSearchParams("limit=200");
    const result = parsePagination(params, 20, 150);

    expect(result.limit).toBe(150);
  });

  it("should calculate skip correctly", () => {
    const params = new URLSearchParams("page=5&limit=25");
    const result = parsePagination(params);

    expect(result.skip).toBe(100); // (5-1) * 25
  });
});
