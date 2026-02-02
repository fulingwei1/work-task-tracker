import { test, expect } from "@playwright/test";
import { NotificationsPage } from "../pages";

test.describe("Notifications Page", () => {
  let notificationsPage: NotificationsPage;

  test.beforeEach(async ({ page }) => {
    notificationsPage = new NotificationsPage(page);
    await notificationsPage.goto();
  });

  test.describe("Page Loading", () => {
    test("should display page heading", async () => {
      await notificationsPage.waitForLoad();
      await expect(notificationsPage.heading).toBeVisible();
    });

    test("should display unread count or all-read message", async () => {
      await notificationsPage.waitForLoad();
      await expect(notificationsPage.unreadCount).toBeVisible();
    });

    test("should display mark all read button", async () => {
      await notificationsPage.waitForLoad();
      await expect(notificationsPage.markAllReadButton).toBeVisible();
    });
  });

  test.describe("Notification List", () => {
    test("should display notifications or empty state", async () => {
      await notificationsPage.waitForLoad();

      const count = await notificationsPage.getNotificationCount();
      if (count === 0) {
        await expect(notificationsPage.emptyState).toBeVisible();
      } else {
        await expect(notificationsPage.notificationItems.first()).toBeVisible();
      }
    });

    test("should display notification type badges", async () => {
      await notificationsPage.waitForLoad();

      const count = await notificationsPage.getNotificationCount();
      if (count > 0) {
        const firstNotification = notificationsPage.notificationItems.first();
        const badge = firstNotification.locator(".rounded-full").first();
        await expect(badge).toBeVisible();
      }
    });

    test("should display notification titles", async () => {
      await notificationsPage.waitForLoad();

      const count = await notificationsPage.getNotificationCount();
      if (count > 0) {
        const title = await notificationsPage.getNotificationTitle(0);
        expect(title.length).toBeGreaterThan(0);
      }
    });

    test("should display relative time for notifications", async () => {
      await notificationsPage.waitForLoad();

      const count = await notificationsPage.getNotificationCount();
      if (count > 0) {
        const firstNotification = notificationsPage.notificationItems.first();
        // Should contain time indicators like 分钟前, 小时前, 天前, etc.
        const hasTimeIndicator = await firstNotification
          .getByText(/刚刚|分钟前|小时前|天前|\d{4}/)
          .isVisible();
        expect(hasTimeIndicator).toBe(true);
      }
    });
  });

  test.describe("Mark as Read", () => {
    test("should show mark as read button for unread notifications", async () => {
      await notificationsPage.waitForLoad();

      const count = await notificationsPage.getNotificationCount();
      if (count > 0) {
        // Check if any notification has "标记已读" button
        const markReadButtons = notificationsPage.page.getByText("标记已读");
        const markReadCount = await markReadButtons.count();

        // If there are unread notifications, mark read buttons should be visible
        if (markReadCount > 0) {
          await expect(markReadButtons.first()).toBeVisible();
        }
      }
    });

    test("should have mark all read button disabled when no unread notifications", async () => {
      await notificationsPage.waitForLoad();

      const markReadButtons = notificationsPage.page.getByText("标记已读");
      const markReadCount = await markReadButtons.count();

      if (markReadCount === 0) {
        // No unread notifications, button should be disabled
        await expect(notificationsPage.markAllReadButton).toBeDisabled();
      }
    });

    test("should mark notification as read when clicking mark read button", async ({ page }) => {
      await notificationsPage.waitForLoad();

      const markReadButtons = page.getByText("标记已读");
      const initialMarkReadCount = await markReadButtons.count();

      if (initialMarkReadCount > 0) {
        await markReadButtons.first().click();

        // Wait for the API call and UI update
        await page.waitForTimeout(500);

        const newMarkReadCount = await page.getByText("标记已读").count();
        expect(newMarkReadCount).toBeLessThan(initialMarkReadCount);
      }
    });

    test("should mark all notifications as read when clicking mark all read", async ({ page }) => {
      await notificationsPage.waitForLoad();

      const markReadButtons = page.getByText("标记已读");
      const hasUnread = (await markReadButtons.count()) > 0;

      if (hasUnread) {
        await notificationsPage.markAllAsRead();

        // Wait for the API call and UI update
        await page.waitForTimeout(500);

        // Should show "已阅读全部通知" or button should be disabled
        const isButtonDisabled = await notificationsPage.markAllReadButton.isDisabled();
        expect(isButtonDisabled).toBe(true);
      }
    });
  });

  test.describe("View Task Link", () => {
    test("should display view task link for task-related notifications", async () => {
      await notificationsPage.waitForLoad();

      const count = await notificationsPage.getNotificationCount();
      if (count > 0) {
        // Check if any notification has "查看任务" link
        const viewTaskLinks = notificationsPage.page.getByText("查看任务");
        const linkCount = await viewTaskLinks.count();

        // Not all notifications might have task links
        if (linkCount > 0) {
          await expect(viewTaskLinks.first()).toBeVisible();
        }
      }
    });

    test("should navigate to tasks page when clicking view task", async ({ page }) => {
      await notificationsPage.waitForLoad();

      const viewTaskLinks = page.getByText("查看任务");
      const linkCount = await viewTaskLinks.count();

      if (linkCount > 0) {
        await viewTaskLinks.first().click();

        // Should navigate to tasks page
        await expect(page).toHaveURL(/\/tasks/);
      }
    });
  });

  test.describe("Error Handling", () => {
    test("should show retry button on error", async ({ page }) => {
      // Intercept API call to simulate error
      await page.route("**/api/notifications", (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: "Internal Server Error" }),
        });
      });

      await notificationsPage.goto();

      // Wait for error state
      await expect(notificationsPage.errorState).toBeVisible({ timeout: 10000 });
      await expect(notificationsPage.retryButton).toBeVisible();
    });
  });
});
