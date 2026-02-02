import { test, expect } from "@playwright/test";
import { TaskListPage, TaskFormPage } from "../pages";

test.describe("Task CRUD Operations", () => {
  const testTaskTitle = `E2E Test Task ${Date.now()}`;

  test.describe("Create Task", () => {
    test("should navigate to new task form", async ({ page }) => {
      const taskListPage = new TaskListPage(page);
      await taskListPage.goto();
      await taskListPage.waitForLoad();
      await taskListPage.clickNewTask();
      await expect(page).toHaveURL(/\/tasks\/new/);
    });

    test("should display task form with all fields", async ({ page }) => {
      const taskFormPage = new TaskFormPage(page);
      await taskFormPage.gotoNew();
      await taskFormPage.waitForLoad();

      await expect(taskFormPage.titleInput).toBeVisible();
      await expect(taskFormPage.ownerSelect).toBeVisible();
      await expect(taskFormPage.prioritySelect).toBeVisible();
      await expect(taskFormPage.dueDateButton).toBeVisible();
      await expect(taskFormPage.acceptanceCriteriaInput).toBeVisible();
      await expect(taskFormPage.submitButton).toBeVisible();
      await expect(taskFormPage.cancelButton).toBeVisible();
    });

    test("should have submit button disabled when required fields are empty", async ({ page }) => {
      const taskFormPage = new TaskFormPage(page);
      await taskFormPage.gotoNew();
      await taskFormPage.waitForLoad();

      await expect(taskFormPage.submitButton).toBeDisabled();
    });

    test("should enable submit button when required fields are filled", async ({ page }) => {
      const taskFormPage = new TaskFormPage(page);
      await taskFormPage.gotoNew();
      await taskFormPage.waitForLoad();

      await taskFormPage.fillTitle(testTaskTitle);

      // Try to select owner - skip test if no users available
      const ownerButton = page.locator("button").filter({ hasText: "选择负责人" });
      const hasOwnerSelect = await ownerButton.isVisible().catch(() => false);
      if (!hasOwnerSelect) {
        test.skip();
        return;
      }

      await ownerButton.click();
      const listbox = page.getByRole("listbox");
      const listboxVisible = await listbox.isVisible({ timeout: 5000 }).catch(() => false);
      if (!listboxVisible) {
        test.skip();
        return;
      }

      const firstOption = listbox.getByRole("option").first();
      const optionVisible = await firstOption.isVisible({ timeout: 3000 }).catch(() => false);
      if (!optionVisible) {
        test.skip();
        return;
      }

      await firstOption.click();
      await expect(taskFormPage.submitButton).toBeEnabled();
    });

    test("should create a new task and redirect to task detail", async ({ page }) => {
      const taskFormPage = new TaskFormPage(page);
      await taskFormPage.gotoNew();
      await taskFormPage.waitForLoad();

      await taskFormPage.fillTitle(testTaskTitle);

      // Try to select owner - skip test if no users available
      const ownerButton = page.locator("button").filter({ hasText: "选择负责人" });
      const hasOwnerSelect = await ownerButton.isVisible().catch(() => false);
      if (!hasOwnerSelect) {
        test.skip();
        return;
      }

      await ownerButton.click();
      const listbox = page.getByRole("listbox");
      const listboxVisible = await listbox.isVisible({ timeout: 5000 }).catch(() => false);
      if (!listboxVisible) {
        test.skip();
        return;
      }

      const firstOption = listbox.getByRole("option").first();
      const optionVisible = await firstOption.isVisible({ timeout: 3000 }).catch(() => false);
      if (!optionVisible) {
        test.skip();
        return;
      }

      await firstOption.click();
      await taskFormPage.submit();

      // Should redirect to task detail page
      await expect(page).toHaveURL(/\/tasks\/[a-z0-9-]+$/);
    });

    test("should navigate back when clicking cancel", async ({ page }) => {
      const taskFormPage = new TaskFormPage(page);
      const taskListPage = new TaskListPage(page);

      await taskListPage.goto();
      await taskListPage.waitForLoad();
      await taskListPage.clickNewTask();

      await taskFormPage.waitForLoad();
      await taskFormPage.cancel();

      // Should go back to task list
      await expect(page).toHaveURL(/\/tasks$/);
    });
  });

  test.describe("Read Task", () => {
    test("should display task list", async ({ page }) => {
      const taskListPage = new TaskListPage(page);
      await taskListPage.goto();
      await taskListPage.waitForLoad();

      await expect(taskListPage.heading).toBeVisible();
    });

    test("should display task details page", async ({ page }) => {
      // First, go to tasks page
      const taskListPage = new TaskListPage(page);
      await taskListPage.goto();
      await taskListPage.waitForLoad();
      await taskListPage.waitForTasksLoad();

      // Check if there are any tasks
      const taskCount = await taskListPage.getTaskCardCount();
      if (taskCount > 0) {
        // Click on the first task card to view details
        const firstCard = taskListPage.taskCards.first();
        await firstCard.click();

        // Should navigate to task detail page
        await expect(page).toHaveURL(/\/tasks\/[a-z0-9-]+$/);
        // Should show task details
        await expect(page.getByText("任务详情")).toBeVisible();
      }
    });
  });

  test.describe("Update Task", () => {
    test("should navigate to edit form from task list", async ({ page }) => {
      const taskListPage = new TaskListPage(page);
      await taskListPage.goto();
      await taskListPage.waitForLoad();
      await taskListPage.waitForTasksLoad();

      const taskCount = await taskListPage.getTaskCardCount();
      if (taskCount > 0) {
        // Open menu and click edit
        const firstCard = taskListPage.taskCards.first();
        const menuButton = firstCard.locator("button").last();
        await menuButton.click();
        await page.getByRole("menuitem", { name: "编辑" }).click();

        await expect(page).toHaveURL(/\/tasks\/[a-z0-9-]+\/edit$/);
      }
    });

    test("should display edit form with existing data", async ({ page }) => {
      const taskListPage = new TaskListPage(page);
      await taskListPage.goto();
      await taskListPage.waitForLoad();
      await taskListPage.waitForTasksLoad();

      const taskCount = await taskListPage.getTaskCardCount();
      if (taskCount > 0) {
        // Open menu and click edit
        const firstCard = taskListPage.taskCards.first();
        const menuButton = firstCard.locator("button").last();
        await menuButton.click();
        await page.getByRole("menuitem", { name: "编辑" }).click();

        // Title field should be pre-filled
        const taskFormPage = new TaskFormPage(page);
        await taskFormPage.waitForLoad();
        const titleValue = await taskFormPage.titleInput.inputValue();
        expect(titleValue.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe("Delete Task", () => {
    test("should show confirmation dialog when deleting", async ({ page }) => {
      const taskListPage = new TaskListPage(page);
      await taskListPage.goto();
      await taskListPage.waitForLoad();
      await taskListPage.waitForTasksLoad();

      const taskCount = await taskListPage.getTaskCardCount();
      if (taskCount > 0) {
        // Set up dialog handler
        let dialogMessage = "";
        page.once("dialog", async (dialog) => {
          dialogMessage = dialog.message();
          await dialog.dismiss();
        });

        // Open menu and click delete
        const firstCard = taskListPage.taskCards.first();
        const menuButton = firstCard.locator("button").last();
        await menuButton.click();
        await page.getByRole("menuitem", { name: "删除" }).click();

        // Dialog should have been shown
        expect(dialogMessage).toContain("确定要删除");
      }
    });
  });

  test.describe("Progress Update", () => {
    test("should open progress update dialog", async ({ page }) => {
      const taskListPage = new TaskListPage(page);
      await taskListPage.goto();
      await taskListPage.waitForLoad();
      await taskListPage.waitForTasksLoad();

      const taskCount = await taskListPage.getTaskCardCount();
      if (taskCount > 0) {
        // Open menu and click update progress
        const firstCard = taskListPage.taskCards.first();
        const menuButton = firstCard.locator("button").last();
        await menuButton.click();
        await page.getByRole("menuitem", { name: "更新进度" }).click();

        // Progress update dialog should be visible
        await expect(page.getByRole("dialog")).toBeVisible();
        await expect(page.getByText("更新进度")).toBeVisible();
      }
    });
  });
});
