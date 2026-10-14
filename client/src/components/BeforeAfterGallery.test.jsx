// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import BeforeAfterGallery from "./BeforeAfterGallery";

afterEach(cleanup);

const approvedImageProject = {
  id: "approved-image",
  title: "Kitchen surface clean",
  serviceType: "Deep cleaning",
  location: "Essex",
  description: "A kitchen surface cleaned as part of a deep clean.",
  mediaType: "image",
  beforeImageSrc: "/images/projects/kitchen-before.webp",
  afterImageSrc: "/images/projects/kitchen-after.webp",
  imageAlt: "Kitchen worktop with visible marks",
  approvalStatus: "approved",
  permissionConfirmed: true,
};

describe("BeforeAfterGallery", () => {
  it("shows the honest empty state and permission note when there is no approved media", () => {
    render(<BeforeAfterGallery projects={[]} />);

    expect(screen.getByRole("heading", { level: 2, name: "Before & After: Real Cleaning Results" })).toBeTruthy();
    expect(screen.getByText("Real before-and-after projects are being added shortly.")).toBeTruthy();
    expect(screen.getByText("Projects are shared with customer permission. Personal details are not displayed.")).toBeTruthy();
  });

  it("does not publish projects without confirmed customer permission", () => {
    render(<BeforeAfterGallery projects={[approvedImageProject, { ...approvedImageProject, id: "unapproved", permissionConfirmed: false }]} />);

    expect(screen.getByRole("heading", { level: 3, name: "Kitchen surface clean" })).toBeTruthy();
    expect(screen.queryByText("Real before-and-after projects are being added shortly.")).toBeNull();
    expect(screen.getByRole("img", { name: "Kitchen worktop with visible marks before cleaning" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Kitchen worktop with visible marks after cleaning" })).toBeTruthy();
  });

  it("uses native controlled video with a poster and accessible description", () => {
    const project = {
      ...approvedImageProject,
      id: "approved-video",
      title: "Short-let bathroom clean",
      mediaType: "video",
      beforeImageSrc: undefined,
      afterImageSrc: undefined,
      videoSrc: "/images/projects/bathroom-clean.mp4",
      posterSrc: "/images/projects/bathroom-poster.webp",
      videoDescription: "A short clip showing the cleaned bathroom surfaces.",
      captionsSrc: "/images/projects/bathroom-captions.vtt",
      duration: "00:32",
    };
    render(<BeforeAfterGallery projects={[project]} />);

    const video = screen.getByLabelText("Short-let bathroom clean: A short clip showing the cleaned bathroom surfaces.");
    expect(video.hasAttribute("controls")).toBe(true);
    expect(video.hasAttribute("autoplay")).toBe(false);
    expect(video.getAttribute("preload")).toBe("none");
    expect(video.getAttribute("poster")).toBe(project.posterSrc);
    expect(video.querySelector("track[kind='captions']").getAttribute("src")).toBe(project.captionsSrc);
    expect(screen.getByText("Duration: 00:32")).toBeTruthy();
  });
});