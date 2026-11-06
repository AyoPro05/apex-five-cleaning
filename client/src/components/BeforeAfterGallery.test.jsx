// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CLEANING_PROJECTS, isPublishableCleaningProject } from "../data/cleaningProjects";
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
  it("shows the approved Basildon bedroom before-and-after pair by default", () => {
    render(<BeforeAfterGallery />);

    const project = screen.getByRole("article");
    const gallery = within(project);
    expect(gallery.getByRole("heading", { level: 3, name: "Airbnb Bedroom Cleaning" })).toBeTruthy();
    expect(gallery.getByText(/Airbnb \/ Holiday Let Cleaning.*Basildon/)).toBeTruthy();
    expect(gallery.getByText("Bedroom cleaning and guest-ready preparation at an Airbnb property in Basildon, Essex.")).toBeTruthy();
    expect(gallery.getAllByRole("img")).toHaveLength(2);

    const before = gallery.getByRole("img", { name: "Bedroom at an Airbnb property in Basildon before cleaning" });
    const after = gallery.getByRole("img", { name: "Bedroom at an Airbnb property in Basildon after cleaning" });
    expect(before.getAttribute("src")).toBe("/images/projects/airbnb-bedroom/Airbnb_Bedroom_Before.webp");
    expect(after.getAttribute("src")).toBe("/images/projects/airbnb-bedroom/Airbnb_Bedroom_After.webp");
    expect(within(before.closest("figure")).getByText("Before")).toBeTruthy();
    expect(within(after.closest("figure")).getByText("After")).toBeTruthy();
    for (const image of [before, after]) {
      expect(image.getAttribute("width")).toBe("960");
      expect(image.getAttribute("height")).toBe("720");
      expect(image.getAttribute("loading")).toBe("lazy");
    }
    expect(screen.queryByText("Real before-and-after projects are being added shortly.")).toBeNull();
  });

  it("references existing WebP assets for the approved Basildon project", () => {
    const project = CLEANING_PROJECTS.find(({ id }) => id === "airbnb-bedroom-basildon-001");
    expect(project).toBeDefined();
    expect(isPublishableCleaningProject(project)).toBe(true);

    for (const imageSrc of [project.beforeImageSrc, project.afterImageSrc]) {
      const image = readFileSync(join(process.cwd(), "public", imageSrc));
      expect(image.subarray(0, 4).toString()).toBe("RIFF");
      expect(image.subarray(8, 12).toString()).toBe("WEBP");
    }
  });

  it.each(["Basildon", "Southend-on-Sea", "Leigh-on-Sea", "London", "Kent", "Essex"])("supports the permitted location %s", (location) => {
    expect(isPublishableCleaningProject({ ...approvedImageProject, location })).toBe(true);
  });

  it("continues to hide projects with an unsupported location label", () => {
    expect(isPublishableCleaningProject({ ...approvedImageProject, location: "Unlisted location" })).toBe(false);
  });

  it("shows the honest empty state and permission note when there is no approved media", () => {
    render(<BeforeAfterGallery projects={[]} />);

    expect(screen.getByRole("heading", { level: 2, name: "Before & After: Real Cleaning Results" })).toBeTruthy();
    expect(screen.getByText("Real before-and-after projects are being added shortly.")).toBeTruthy();
    expect(screen.getByText("Projects are shared with customer permission. Personal details are not displayed.")).toBeTruthy();
  });

  it.each([
    ["pending approval", { approvalStatus: "pending" }],
    ["missing approval", { approvalStatus: undefined }],
    ["unconfirmed permission", { permissionConfirmed: false }],
    ["missing permission", { permissionConfirmed: undefined }],
  ])("hides projects with %s while preserving approved projects", (_reason, overrides) => {
    const withheldProject = { ...approvedImageProject, id: "withheld", title: "Withheld project", ...overrides };
    render(<BeforeAfterGallery projects={[approvedImageProject, withheldProject]} />);

    expect(screen.getByRole("heading", { level: 3, name: "Kitchen surface clean" })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 3, name: "Withheld project" })).toBeNull();
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.queryByText("Real before-and-after projects are being added shortly.")).toBeNull();
    expect(screen.getByRole("img", { name: "Kitchen worktop with visible marks before cleaning" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Kitchen worktop with visible marks after cleaning" })).toBeTruthy();
  });

  it("continues to support single-image projects", () => {
    render(<BeforeAfterGallery projects={[{
      ...approvedImageProject,
      imageSrc: "/images/projects/kitchen.webp",
      beforeImageSrc: undefined,
      afterImageSrc: undefined,
    }]} />);

    expect(screen.getByRole("img", { name: approvedImageProject.imageAlt }).getAttribute("src")).toBe("/images/projects/kitchen.webp");
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.queryByText("Before")).toBeNull();
    expect(screen.queryByText("After")).toBeNull();
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
