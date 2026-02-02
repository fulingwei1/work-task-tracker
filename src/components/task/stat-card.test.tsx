import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClipboardList, Clock, AlertTriangle } from "lucide-react";
import { StatCard } from "./stat-card";

describe("StatCard", () => {
  it("should render title and value", () => {
    render(
      <StatCard
        title="待办任务"
        value={10}
        icon={ClipboardList}
        color="primary"
      />
    );
    expect(screen.getByText("待办任务")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("should render zero value", () => {
    render(
      <StatCard
        title="进行中"
        value={0}
        icon={Clock}
        color="blue"
      />
    );
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("should render large numbers", () => {
    render(
      <StatCard
        title="总任务"
        value={9999}
        icon={ClipboardList}
        color="primary"
      />
    );
    expect(screen.getByText("9999")).toBeInTheDocument();
  });

  it("should apply primary color styling", () => {
    const { container } = render(
      <StatCard
        title="测试"
        value={5}
        icon={ClipboardList}
        color="primary"
      />
    );
    const valueEl = container.querySelector(".text-indigo-600");
    expect(valueEl).toBeInTheDocument();
  });

  it("should apply blue color styling", () => {
    const { container } = render(
      <StatCard
        title="测试"
        value={5}
        icon={Clock}
        color="blue"
      />
    );
    const valueEl = container.querySelector(".text-blue-600");
    expect(valueEl).toBeInTheDocument();
  });

  it("should apply warning color styling", () => {
    const { container } = render(
      <StatCard
        title="测试"
        value={5}
        icon={AlertTriangle}
        color="warning"
      />
    );
    const valueEl = container.querySelector(".text-amber-600");
    expect(valueEl).toBeInTheDocument();
  });

  it("should apply danger color styling", () => {
    const { container } = render(
      <StatCard
        title="测试"
        value={5}
        icon={AlertTriangle}
        color="danger"
      />
    );
    const valueEl = container.querySelector(".text-red-600");
    expect(valueEl).toBeInTheDocument();
  });

  it("should render as a link when href is provided", () => {
    render(
      <StatCard
        title="待办任务"
        value={10}
        icon={ClipboardList}
        color="primary"
        href="/tasks?status=NOT_STARTED"
      />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/tasks?status=NOT_STARTED");
  });

  it("should not render as a link when href is not provided", () => {
    render(
      <StatCard
        title="待办任务"
        value={10}
        icon={ClipboardList}
        color="primary"
      />
    );
    const link = screen.queryByRole("link");
    expect(link).not.toBeInTheDocument();
  });
});
