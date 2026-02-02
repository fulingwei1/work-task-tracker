import { type Locator, type Page, expect } from "@playwright/test";

export class TaskFormPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly backButton: Locator;
  readonly titleInput: Locator;
  readonly ownerSelect: Locator;
  readonly prioritySelect: Locator;
  readonly dueDateButton: Locator;
  readonly acceptanceCriteriaInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /新建任务|编辑任务/ });
    this.backButton = page.getByRole("link", { name: "返回任务列表" });
    this.titleInput = page.getByLabel(/标题/);
    this.ownerSelect = page.locator("button").filter({ hasText: /选择负责人|加载中/ });
    this.prioritySelect = page.locator("button").filter({ hasText: /P1|P2|P3/ });
    this.dueDateButton = page.getByRole("button", { name: /选择日期|\d{4}/ });
    this.acceptanceCriteriaInput = page.getByLabel("验收标准");
    this.submitButton = page.getByRole("button", { name: /创建任务|更新任务/ });
    this.cancelButton = page.getByRole("button", { name: "取消" });
    this.errorMessage = page.locator(".bg-red-50");
  }

  async gotoNew() {
    await this.page.goto("/tasks/new");
  }

  async gotoEdit(taskId: string) {
    await this.page.goto(`/tasks/${taskId}/edit`);
  }

  async waitForLoad() {
    await expect(this.heading).toBeVisible();
    // Wait for users to load - the select should show "选择负责人" instead of "加载中"
    await this.page.waitForFunction(
      () => {
        const buttons = document.querySelectorAll("button");
        return Array.from(buttons).some(
          (b) => b.textContent?.includes("选择负责人")
        );
      },
      { timeout: 15000 }
    );
  }

  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async selectOwner(ownerName: string) {
    // Wait for the owner select to be ready
    const ownerButton = this.page.locator("button").filter({ hasText: "选择负责人" });
    await expect(ownerButton).toBeVisible({ timeout: 10000 });
    await ownerButton.click();
    await this.page.getByRole("option", { name: ownerName }).click();
  }

  async selectFirstOwner() {
    // Wait for the owner select to be ready (not showing "加载中")
    const ownerButton = this.page.locator("button").filter({ hasText: "选择负责人" });
    await expect(ownerButton).toBeVisible({ timeout: 15000 });
    await ownerButton.click();

    // Wait for the dropdown to open and options to appear
    const listbox = this.page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5000 });

    // Click the first option
    const firstOption = listbox.getByRole("option").first();
    await expect(firstOption).toBeVisible({ timeout: 5000 });
    await firstOption.click();
  }

  async selectPriority(priority: "P1" | "P2" | "P3") {
    await this.prioritySelect.click();
    const labels: Record<string, string> = {
      P1: "P1 - 高优先级",
      P2: "P2 - 中优先级",
      P3: "P3 - 低优先级",
    };
    await this.page.getByRole("option", { name: labels[priority] }).click();
  }

  async selectDueDate(daysFromNow: number) {
    await this.dueDateButton.click();
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    const day = date.getDate();
    await this.page.getByRole("gridcell", { name: String(day), exact: true }).click();
  }

  async fillAcceptanceCriteria(criteria: string) {
    await this.acceptanceCriteriaInput.fill(criteria);
  }

  async submit() {
    await this.submitButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async createTask(data: {
    title: string;
    owner: string;
    priority?: "P1" | "P2" | "P3";
    daysUntilDue?: number;
    acceptanceCriteria?: string;
  }) {
    await this.fillTitle(data.title);
    await this.selectOwner(data.owner);
    if (data.priority) {
      await this.selectPriority(data.priority);
    }
    if (data.daysUntilDue !== undefined) {
      await this.selectDueDate(data.daysUntilDue);
    }
    if (data.acceptanceCriteria) {
      await this.fillAcceptanceCriteria(data.acceptanceCriteria);
    }
    await this.submit();
  }
}
