import { type Locator, type Page, expect } from "@playwright/test";

export class NotificationsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly unreadCount: Locator;
  readonly markAllReadButton: Locator;
  readonly notificationItems: Locator;
  readonly emptyState: Locator;
  readonly loadingSpinner: Locator;
  readonly errorState: Locator;
  readonly retryButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "通知中心" });
    this.unreadCount = page.getByText(/\d+ 条未读通知|已阅读全部通知/);
    this.markAllReadButton = page.getByRole("button", { name: "全部标记已读" });
    this.notificationItems = page.locator(".divide-y > div");
    this.emptyState = page.getByText("暂无通知");
    this.loadingSpinner = page.locator(".animate-spin");
    this.errorState = page.locator(".text-red-500");
    this.retryButton = page.getByRole("button", { name: "重试" });
  }

  async goto() {
    await this.page.goto("/notifications");
  }

  async waitForLoad() {
    await expect(this.heading).toBeVisible({ timeout: 30000 });
    // Wait for content to load - either notifications appear, empty state shows, or error state shows
    await this.page.waitForFunction(
      () => {
        const spinner = document.querySelector(".animate-spin");
        const emptyState = document.body.textContent?.includes("暂无通知");
        const notifications = document.querySelectorAll(".divide-y > div");
        const errorState = document.querySelector(".text-red-500");
        // Loading is complete when spinner is gone OR content is visible
        return !spinner || emptyState || notifications.length > 0 || errorState;
      },
      { timeout: 30000 }
    );
  }

  async getNotificationCount(): Promise<number> {
    return this.notificationItems.count();
  }

  async getUnreadNotifications(): Promise<Locator> {
    return this.notificationItems.filter({
      has: this.page.locator(".bg-indigo-500"),
    });
  }

  async markAsRead(index: number) {
    const notification = this.notificationItems.nth(index);
    const markReadButton = notification.getByText("标记已读");
    if (await markReadButton.isVisible()) {
      await markReadButton.click();
    }
  }

  async markAllAsRead() {
    await this.markAllReadButton.click();
  }

  async clickViewTask(index: number) {
    const notification = this.notificationItems.nth(index);
    const viewTaskLink = notification.getByText("查看任务");
    if (await viewTaskLink.isVisible()) {
      await viewTaskLink.click();
    }
  }

  async getNotificationTitle(index: number): Promise<string> {
    const notification = this.notificationItems.nth(index);
    const title = notification.locator("h3");
    return (await title.textContent()) ?? "";
  }

  async getNotificationType(index: number): Promise<string> {
    const notification = this.notificationItems.nth(index);
    const badge = notification.locator(".rounded-full").first();
    return (await badge.textContent()) ?? "";
  }
}
