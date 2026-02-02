import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriorityBadge, PriorityIndicator } from "./priority-badge";

describe("PriorityBadge", () => {
  it("should render P1 badge", () => {
    render(<PriorityBadge priority="P1" />);
    expect(screen.getByText("P1")).toBeInTheDocument();
  });

  it("should render P2 badge", () => {
    render(<PriorityBadge priority="P2" />);
    expect(screen.getByText("P2")).toBeInTheDocument();
  });

  it("should render P3 badge", () => {
    render(<PriorityBadge priority="P3" />);
    expect(screen.getByText("P3")).toBeInTheDocument();
  });

  it("should apply red styling for P1", () => {
    const { container } = render(<PriorityBadge priority="P1" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-red-50");
    expect(badge.className).toContain("text-red-600");
  });

  it("should apply amber styling for P2", () => {
    const { container } = render(<PriorityBadge priority="P2" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-amber-50");
    expect(badge.className).toContain("text-amber-600");
  });

  it("should apply gray styling for P3", () => {
    const { container } = render(<PriorityBadge priority="P3" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("bg-gray-100");
    expect(badge.className).toContain("text-gray-600");
  });
});

describe("PriorityIndicator", () => {
  it("should render a thin indicator bar for P1", () => {
    const { container } = render(<PriorityIndicator priority="P1" />);
    const indicator = container.firstChild as HTMLElement;
    expect(indicator).toBeInTheDocument();
    expect(indicator.className).toContain("bg-red-500");
  });

  it("should render a thin indicator bar for P2", () => {
    const { container } = render(<PriorityIndicator priority="P2" />);
    const indicator = container.firstChild as HTMLElement;
    expect(indicator.className).toContain("bg-amber-500");
  });

  it("should render a thin indicator bar for P3", () => {
    const { container } = render(<PriorityIndicator priority="P3" />);
    const indicator = container.firstChild as HTMLElement;
    expect(indicator.className).toContain("bg-gray-400");
  });
});
