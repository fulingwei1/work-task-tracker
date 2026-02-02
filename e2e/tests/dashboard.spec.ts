import { test, expect } from "@playwright/test";
import { DashboardPage } from "../pages";

test.describe("Dashboard Page", () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test("should display page heading and subtitle", async () => {
    await expect(dashboardPage.heading).toBeVisible();
    await expect(dashboardPage.page.getByText("欢迎回来，查看您的任务概览")).toBeVisible();
  });

  test("should display new task button", async () => {
    await expect(dashboardPage.newTaskButton).toBeVisible();
  });

  test("should display stat cards", async () => {
    await expect(dashboardPage.pendingStatCard).toBeVisible();
    await expect(dashboardPage.inProgressStatCard).toBeVisible();
    await expect(dashboardPage.dueSoonStatCard).toBeVisible();
    await expect(dashboardPage.overdueStatCard).toBeVisible();
  });

  test("should display recent tasks section", async () => {
    await expect(dashboardPage.recentTasksSection).toBeVisible();
  });

  test("should display view all link", async () => {
    await expect(dashboardPage.viewAllLink).toBeVisible();
  });

  test("should navigate to new task page when clicking new task button", async () => {
    await dashboardPage.clickNewTask();
    await expect(dashboardPage.page).toHaveURL(/\/tasks\/new/);
  });

  test("should navigate to tasks page when clicking view all", async () => {
    await dashboardPage.clickViewAll();
    await expect(dashboardPage.page).toHaveURL(/\/tasks/);
  });

  test("stat cards should link to filtered task lists", async ({ page }) => {
    // Check pending tasks card links to status filter
    const pendingLink = page.getByRole("link", { name: /待办任务/ });
    await expect(pendingLink).toHaveAttribute("href", "/tasks?status=NOT_STARTED");

    // Check in-progress tasks card links to status filter
    const inProgressLink = page.getByRole("link", { name: /进行中/ });
    await expect(inProgressLink).toHaveAttribute("href", "/tasks?status=IN_PROGRESS");
  });
});
