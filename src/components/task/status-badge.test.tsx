import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("should render NOT_STARTED status in Chinese", () => {
    render(<StatusBadge status="NOT_STARTED" />);
    expect(screen.getByText("未开始")).toBeInTheDocument();
  });

  it("should render IN_PROGRESS status in Chinese", () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText("进行中")).toBeInTheDocument();
  });

  it("should render PENDING_REVIEW status in Chinese", () => {
    render(<StatusBadge status="PENDING_REVIEW" />);
    expect(screen.getByText("待审核")).toBeInTheDocument();
  });

  it("should render COMPLETED status in Chinese", () => {
    render(<StatusBadge status="COMPLETED" />);
    expect(screen.getByText("已完成")).toBeInTheDocument();
  });

  it("should render BLOCKED status in Chinese", () => {
    render(<StatusBadge status="BLOCKED" />);
    expect(screen.getByText("已阻塞")).toBeInTheDocument();
  });

  it("should render CANCELLED status in Chinese", () => {
    render(<StatusBadge status="CANCELLED" />);
    expect(screen.getByText("已取消")).toBeInTheDocument();
  });

  it("should apply correct styling for NOT_STARTED", () => {
    const { container } = render(<StatusBadge status="NOT_STARTED" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-gray-100");
    expect(badge.className).toContain("text-gray-600");
  });

  it("should apply correct styling for IN_PROGRESS", () => {
    const { container } = render(<StatusBadge status="IN_PROGRESS" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-blue-50");
    expect(badge.className).toContain("text-blue-600");
  });

  it("should apply correct styling for COMPLETED", () => {
    const { container } = render(<StatusBadge status="COMPLETED" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-emerald-50");
    expect(badge.className).toContain("text-emerald-600");
  });

  it("should render with small size when specified", () => {
    const { container } = render(<StatusBadge status="NOT_STARTED" size="sm" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-xs");
  });
});
