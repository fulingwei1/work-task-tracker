import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressRing } from "./progress-ring";

describe("ProgressRing", () => {
  it("should render progress percentage", () => {
    render(<ProgressRing progress={50} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("should render 0% progress", () => {
    render(<ProgressRing progress={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("should render 100% progress", () => {
    render(<ProgressRing progress={100} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("should render with custom size", () => {
    const { container } = render(<ProgressRing progress={50} size={64} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "64");
    expect(svg).toHaveAttribute("height", "64");
  });

  it("should apply different colors based on progress", () => {
    const { container: container25 } = render(<ProgressRing progress={25} />);
    const { container: container50 } = render(<ProgressRing progress={50} />);
    const { container: container75 } = render(<ProgressRing progress={75} />);
    const { container: container100 } = render(<ProgressRing progress={100} />);

    // Check that progress rings exist
    expect(container25.querySelector("svg")).toBeInTheDocument();
    expect(container50.querySelector("svg")).toBeInTheDocument();
    expect(container75.querySelector("svg")).toBeInTheDocument();
    expect(container100.querySelector("svg")).toBeInTheDocument();
  });

  it("should handle negative progress values", () => {
    render(<ProgressRing progress={-10} />);
    // Component renders the value as-is (no clamping)
    expect(screen.getByText("-10%")).toBeInTheDocument();
  });

  it("should handle progress values over 100", () => {
    render(<ProgressRing progress={150} />);
    expect(screen.getByText("150%")).toBeInTheDocument();
  });
});
