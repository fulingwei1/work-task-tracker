import { type Locator, type Page, expect } from "@playwright/test";

export class TaskListPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newTaskButton: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly priorityFilter: Locator;
  readonly taskCards: Locator;
  readonly emptyState: Locator;
  readonly clearFiltersButton: Locator;
  readonly pagination: Locator;
  readonly previousButton: Locator;
  readonly nextButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "任务列表" });
    this.newTaskButton = page.getByRole("link", { name: "新建任务" });
    this.searchInput = page.getByRole("main").getByPlaceholder("搜索任务...");
    this.statusFilter = page.locator('[data-testid="status-filter"]');
    this.priorityFilter = page.locator('[data-testid="priority-filter"]');
    this.taskCards = page.locator("[data-testid='task-card']");
    this.emptyState = page.getByText("未找到任务");
    this.clearFiltersButton = page.getByRole("button", { name: "清除筛选" });
    this.pagination = page.locator(".flex.items-center.justify-between").last();
    this.previousButton = page.getByRole("button", { name: "上一页" });
    this.nextButton = page.getByRole("button", { name: "下一页" });
  }

  async goto() {
    await this.page.goto("/tasks");
  }

  async gotoWithFilters(params: { status?: string; priority?: string }) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set("status", params.status);
    if (params.priority) searchParams.set("priority", params.priority);
    const queryString = searchParams.toString();
    await this.page.goto(`/tasks${queryString ? `?${queryString}` : ""}`);
  }

  async waitForLoad() {
    await expect(this.heading).toBeVisible();
  }

  async waitForTasksLoad() {
    // Wait for loading to complete - no more skeletons
    await this.page.waitForFunction(() => {
      const skeletons = document.querySelectorAll(".animate-pulse");
      return skeletons.length === 0;
    });
  }

  async clickNewTask() {
    await this.newTaskButton.click();
    await this.page.waitForURL(/\/tasks\/new/);
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async selectStatus(status: string) {
    await this.statusFilter.click();
    await this.page.getByRole("option", { name: status }).click();
  }

  async selectPriority(priority: string) {
    await this.priorityFilter.click();
    await this.page.getByRole("option", { name: priority }).click();
  }

  async clearFilters() {
    await this.clearFiltersButton.click();
  }

  async getTaskCardCount(): Promise<number> {
    return this.taskCards.count();
  }

  async getTaskCardByTitle(title: string): Promise<Locator> {
    return this.taskCards.filter({ hasText: title }).first();
  }

  async clickTaskCard(title: string) {
    const card = await this.getTaskCardByTitle(title);
    await card.click();
  }

  async openTaskMenu(title: string) {
    const card = await this.getTaskCardByTitle(title);
    await card.getByRole("button", { name: "操作菜单" }).click();
  }

  async deleteTask(title: string) {
    await this.openTaskMenu(title);
    this.page.once("dialog", (dialog) => dialog.accept());
    await this.page.getByRole("menuitem", { name: "删除" }).click();
  }

  async editTask(title: string) {
    await this.openTaskMenu(title);
    await this.page.getByRole("menuitem", { name: "编辑" }).click();
    await this.page.waitForURL(/\/tasks\/.*\/edit/);
  }

  async updateProgress(title: string) {
    await this.openTaskMenu(title);
    await this.page.getByRole("menuitem", { name: "更新进度" }).click();
  }
}
