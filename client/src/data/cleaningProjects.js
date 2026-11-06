/**
 * @typedef {Object} CleaningProject
 * @property {string} id
 * @property {string} title
 * @property {string} serviceType
 * @property {string} location
 * @property {string} description
 * @property {"image" | "video"} mediaType
 * @property {string} imageAlt
 * @property {string} [imageSrc]
 * @property {string} [beforeImageSrc]
 * @property {string} [afterImageSrc]
 * @property {string} [videoSrc]
 * @property {string} [posterSrc]
 * @property {string} [videoDescription]
 * @property {string} [captionsSrc]
 * @property {string} [captionsLang]
 * @property {string} [duration]
 * @property {"pending" | "approved"} approvalStatus
 * @property {boolean} permissionConfirmed
 */

/** @type {CleaningProject[]} */
export const CLEANING_PROJECTS = [
  {
    id: "airbnb-bedroom-basildon-001",
    title: "Airbnb Bedroom Cleaning",
    serviceType: "Airbnb / Holiday Let Cleaning",
    location: "Basildon",
    mediaType: "image",
    description: "Bedroom cleaning and guest-ready preparation at an Airbnb property in Basildon, Essex.",
    beforeImageSrc: "/images/projects/airbnb-bedroom/Airbnb_Bedroom_Before.webp",
    afterImageSrc: "/images/projects/airbnb-bedroom/Airbnb_Bedroom_After.webp",
    imageAlt: "Bedroom at an Airbnb property in Basildon",
    approvalStatus: "approved",
    permissionConfirmed: true,
  },
];

const BROAD_AREA_LABELS = new Set([
  "Southend-on-Sea",
  "Leigh-on-Sea",
  "Basildon",
  "London",
  "Kent",
  "Essex",
]);

export function isPublishableCleaningProject(project) {
  if (
    project?.approvalStatus !== "approved" ||
    project?.permissionConfirmed !== true ||
    !project.id ||
    !project.title ||
    !project.serviceType ||
    !BROAD_AREA_LABELS.has(project.location) ||
    !project.description
  ) {
    return false;
  }

  if (project.mediaType === "image") {
    return Boolean(
      project.imageAlt &&
        (project.imageSrc || project.beforeImageSrc || project.afterImageSrc),
    );
  }

  if (project.mediaType === "video") {
    return Boolean(
      project.videoSrc &&
        project.imageAlt &&
        (project.videoDescription || project.captionsSrc),
    );
  }

  return false;
}
