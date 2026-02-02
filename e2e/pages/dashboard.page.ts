import { type Locator, type Page, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newTaskButton: Locator;
  readonly pendingStatCard: Locator;
  readonly inProgressStatCard: Locator;
  readonly dueSoonStatCard: Locator;
  readonly overdueStatCard: Locator;
  readonly recentTasksSection: Locator;
  readonly taskCards: Locator;
  readonly viewAllLink: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "工作台" });
    this.newTaskButton = page.getByRole("link", { name: "新建任务" });
    this.pendingStatCard = page.getByText("待办任务").locator("..");
    this.inProgressStatCard = page.getByText("进行中").locator("..");
    this.dueSoonStatCard = page.getByText("本周到期").locator("..");
    this.overdueStatCard = page.getByText("已逾期").locator("..");
    this.recentTasksSection = page.getByRole("heading", { name: "最近任务" }).locator("..");
    this.taskCards = page.locator("[data-testid='task-card']");
    this.viewAllLink = page.getByRole("link", { name: "查看全部" });
    this.emptyState = page.getByText("暂无任务");
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  async waitForLoad() {
    await expect(this.heading).toBeVisible();
  }

  async getStatValue(cardLocator: Locator): Promise<string> {
    const valueElement = cardLocator.locator("text=/\\d+/");
    return (await valueElement.textContent()) ?? "0";
  }

  async clickNewTask() {
    await this.newTaskButton.click();
    await this.page.waitForURL(/\/tasks\/new/);
  }

  async clickViewAll() {
    await this.viewAllLink.click();
    await this.page.waitForURL(/\/tasks/);
  }

  async getTaskCardCount(): Promise<number> {
    return this.taskCards.count();
  }

  async clickTaskCard(index: number) {
    const card = this.taskCards.nth(index);
    await card.click();
  }
}
