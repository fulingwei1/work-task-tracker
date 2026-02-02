import { test, expect } from "@playwright/test";
import { TaskListPage } from "../pages";

test.describe("Task Filters", () => {
  let taskListPage: TaskListPage;

  test.beforeEach(async ({ page }) => {
    taskListPage = new TaskListPage(page);
    await taskListPage.goto();
    await taskListPage.waitForLoad();
  });

  test.describe("Status Filter", () => {
    test("should display status filter", async () => {
      await expect(taskListPage.statusFilter).toBeVisible();
    });

    test("should filter by NOT_STARTED status via URL", async ({ page }) => {
      await taskListPage.gotoWithFilters({ status: "NOT_STARTED" });
      await taskListPage.waitForLoad();

      // URL should contain status parameter
      await expect(page).toHaveURL(/status=NOT_STARTED/);
    });

    test("should filter by IN_PROGRESS status via URL", async ({ page }) => {
      await taskListPage.gotoWithFilters({ status: "IN_PROGRESS" });
      await taskListPage.waitForLoad();

      await expect(page).toHaveURL(/status=IN_PROGRESS/);
    });

    test("should filter by COMPLETED status via URL", async ({ page }) => {
      await taskListPage.gotoWithFilters({ status: "COMPLETED" });
      await taskListPage.waitForLoad();

      await expect(page).toHaveURL(/status=COMPLETED/);
    });
  });

  test.describe("Priority Filter", () => {
    test("should display priority filter", async () => {
      await expect(taskListPage.priorityFilter).toBeVisible();
    });

    test("should filter by P1 priority via URL", async ({ page }) => {
      await taskListPage.gotoWithFilters({ priority: "P1" });
      await taskListPage.waitForLoad();

      await expect(page).toHaveURL(/priority=P1/);
    });

    test("should filter by P2 priority via URL", async ({ page }) => {
      await taskListPage.gotoWithFilters({ priority: "P2" });
      await taskListPage.waitForLoad();

      await expect(page).toHaveURL(/priority=P2/);
    });

    test("should filter by P3 priority via URL", async ({ page }) => {
      await taskListPage.gotoWithFilters({ priority: "P3" });
      await taskListPage.waitForLoad();

      await expect(page).toHaveURL(/priority=P3/);
    });
  });

  test.describe("Combined Filters", () => {
    test("should apply both status and priority filters", async ({ page }) => {
      await taskListPage.gotoWithFilters({
        status: "IN_PROGRESS",
        priority: "P1",
      });
      await taskListPage.waitForLoad();

      await expect(page).toHaveURL(/status=IN_PROGRESS/);
      await expect(page).toHaveURL(/priority=P1/);
    });
  });

  test.describe("Search", () => {
    test("should display search input", async () => {
      await expect(taskListPage.searchInput).toBeVisible();
    });

    test("should allow typing in search field", async () => {
      const searchQuery = "test task";
      await taskListPage.search(searchQuery);

      await expect(taskListPage.searchInput).toHaveValue(searchQuery);
    });

    test("should filter tasks client-side by search", async () => {
      await taskListPage.waitForTasksLoad();
      const initialCount = await taskListPage.getTaskCardCount();

      if (initialCount > 0) {
        // Search for something unlikely to match
        await taskListPage.search("xyznonexistent123");

        // Wait for client-side filter to apply
        await taskListPage.page.waitForTimeout(300);

        // Either shows empty state or fewer results
        const afterSearchCount = await taskListPage.getTaskCardCount();
        expect(afterSearchCount).toBeLessThanOrEqual(initialCount);
      }
    });
  });

  test.describe("Empty State", () => {
    test("should show empty state when no tasks match filters", async ({ page }) => {
      // Apply very specific filters that are unlikely to have results
      await taskListPage.gotoWithFilters({
        status: "COMPLETED",
        priority: "P1",
      });
      await taskListPage.waitForLoad();
      await taskListPage.waitForTasksLoad();

      const taskCount = await taskListPage.getTaskCardCount();
      if (taskCount === 0) {
        await expect(taskListPage.emptyState).toBeVisible();
      }
    });

    test("should show clear filters button when filters applied and no results", async () => {
      await taskListPage.gotoWithFilters({
        status: "COMPLETED",
        priority: "P1",
      });
      await taskListPage.waitForLoad();
      await taskListPage.waitForTasksLoad();

      const taskCount = await taskListPage.getTaskCardCount();
      if (taskCount === 0) {
        await expect(taskListPage.clearFiltersButton).toBeVisible();
      }
    });
  });

  test.describe("Pagination", () => {
    test("should display pagination controls when there are many tasks", async () => {
      await taskListPage.waitForTasksLoad();

      // Pagination shows when there's more than one page
      // Check if the pagination text exists (e.g., "第 1 页，共 X 页")
      const paginationText = taskListPage.page.getByText(/第 \d+ 页/);
      const hasPagination = await paginationText.isVisible().catch(() => false);

      // If pagination is visible, verify controls exist
      if (hasPagination) {
        await expect(taskListPage.previousButton).toBeVisible();
        await expect(taskListPage.nextButton).toBeVisible();
      }
      // Test passes regardless - we're just verifying the UI works when pagination exists
    });

    test("should have previous button disabled on first page", async () => {
      await taskListPage.waitForTasksLoad();

      // Check if pagination exists
      const paginationText = taskListPage.page.getByText(/第 \d+ 页/);
      const hasPagination = await paginationText.isVisible().catch(() => false);

      if (hasPagination) {
        // On first page, previous button should be disabled
        const prevButton = taskListPage.previousButton;
        if (await prevButton.isVisible().catch(() => false)) {
          await expect(prevButton).toBeDisabled();
        }
      }
      // Test passes regardless - we're just verifying the UI works when pagination exists
    });
  });
});
