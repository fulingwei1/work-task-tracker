import { describe, it, expect, vi } from "vitest";
import { UserRole } from "@prisma/client";
import { getTaskVisibilityFilter, canViewTask, canEditTask } from "@/lib/api/permissions";
import type { SessionUser } from "@/lib/auth";

// Helper to create mock user
function createMockUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: "user-1",
    name: "Test User",
    role: UserRole.STAFF,
    departmentId: "dept-1",
    ...overrides,
  };
}

describe("getTaskVisibilityFilter", () => {
  it("should return ownerId filter for STAFF", () => {
    const user = createMockUser({ role: UserRole.STAFF });
    const filter = getTaskVisibilityFilter(user);

    expect(filter).toEqual({ ownerId: "user-1" });
  });

  it("should return department filter for MANAGER", () => {
    const user = createMockUser({ role: UserRole.MANAGER, departmentId: "dept-1" });
    const filter = getTaskVisibilityFilter(user);

    expect(filter).toEqual({ owner: { departmentId: "dept-1" } });
  });

  it("should return undefined for DIRECTOR (no filter)", () => {
    const user = createMockUser({ role: UserRole.DIRECTOR });
    const filter = getTaskVisibilityFilter(user);

    expect(filter).toBeUndefined();
  });

  it("should return undefined for CEO (no filter)", () => {
    const user = createMockUser({ role: UserRole.CEO });
    const filter = getTaskVisibilityFilter(user);

    expect(filter).toBeUndefined();
  });

  it("should return undefined for ADMIN (no filter)", () => {
    const user = createMockUser({ role: UserRole.ADMIN });
    const filter = getTaskVisibilityFilter(user);

    expect(filter).toBeUndefined();
  });
});

describe("canViewTask", () => {
  it("should allow STAFF to view their own task", async () => {
    const user = createMockUser({ id: "user-1", role: UserRole.STAFF });
    const result = await canViewTask(user, "user-1", "dept-1");

    expect(result).toBe(true);
  });

  it("should not allow STAFF to view other's task", async () => {
    const user = createMockUser({ id: "user-1", role: UserRole.STAFF });
    const result = await canViewTask(user, "user-2", "dept-1");

    expect(result).toBe(false);
  });

  it("should allow MANAGER to view department tasks", async () => {
    const user = createMockUser({ role: UserRole.MANAGER, departmentId: "dept-1" });
    const result = await canViewTask(user, "user-2", "dept-1");

    expect(result).toBe(true);
  });

  it("should not allow MANAGER to view other department tasks", async () => {
    const user = createMockUser({ role: UserRole.MANAGER, departmentId: "dept-1" });
    const result = await canViewTask(user, "user-2", "dept-2");

    expect(result).toBe(false);
  });

  it("should allow ADMIN to view any task", async () => {
    const user = createMockUser({ role: UserRole.ADMIN, departmentId: "dept-1" });
    const result = await canViewTask(user, "user-2", "dept-2");

    expect(result).toBe(true);
  });
});

describe("canEditTask", () => {
  const mockTask = {
    ownerId: "owner-1",
    createdBy: "creator-1",
    owner: { departmentId: "dept-1" },
  };

  it("should allow task owner to edit", async () => {
    const user = createMockUser({ id: "owner-1", role: UserRole.STAFF });
    const result = await canEditTask(user, mockTask);

    expect(result).toBe(true);
  });

  it("should allow task creator to edit", async () => {
    const user = createMockUser({ id: "creator-1", role: UserRole.STAFF });
    const result = await canEditTask(user, mockTask);

    expect(result).toBe(true);
  });

  it("should not allow other STAFF to edit", async () => {
    const user = createMockUser({ id: "other-user", role: UserRole.STAFF });
    const result = await canEditTask(user, mockTask);

    expect(result).toBe(false);
  });

  it("should allow MANAGER to edit department tasks", async () => {
    const user = createMockUser({ id: "manager-1", role: UserRole.MANAGER, departmentId: "dept-1" });
    const result = await canEditTask(user, mockTask);

    expect(result).toBe(true);
  });

  it("should allow ADMIN to edit any task", async () => {
    const user = createMockUser({ id: "admin-1", role: UserRole.ADMIN, departmentId: "dept-2" });
    const result = await canEditTask(user, mockTask);

    expect(result).toBe(true);
  });
});
