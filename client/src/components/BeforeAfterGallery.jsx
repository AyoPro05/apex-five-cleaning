import { CLEANING_PROJECTS, isPublishableCleaningProject } from "../data/cleaningProjects";

function ProjectImages({ project }) {
  if (project.beforeImageSrc || project.afterImageSrc) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {project.beforeImageSrc && (
          <figure>
            <img
              src={project.beforeImageSrc}
              alt={`${project.imageAlt} before cleaning`}
              width="960"
              height="720"
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full rounded-md object-cover"
            />
            <figcaption className="mt-2 text-xs font-semibold text-zinc-600">Before</figcaption>
          </figure>
        )}
        {project.afterImageSrc && (
          <figure>
            <img
              src={project.afterImageSrc}
              alt={`${project.imageAlt} after cleaning`}
              width="960"
              height="720"
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full rounded-md object-cover"
            />
            <figcaption className="mt-2 text-xs font-semibold text-zinc-600">After</figcaption>
          </figure>
        )}
      </div>
    );
  }

  return (
    <img
      src={project.imageSrc}
      alt={project.imageAlt}
      width="960"
      height="720"
      loading="lazy"
      decoding="async"
      className="aspect-[4/3] w-full rounded-md object-cover"
    />
  );
}

function ProjectMedia({ project }) {
  if (project.mediaType === "image") return <ProjectImages project={project} />;

  return (
    <div>
      <video
        aria-label={`${project.title}: ${project.videoDescription || project.description}`}
        controls
        muted
        preload="none"
        poster={project.posterSrc}
        width="960"
        height="540"
        className="aspect-video w-full rounded-md bg-zinc-100"
      >
        <source src={project.videoSrc} />
        {project.captionsSrc && (
          <track
            kind="captions"
            src={project.captionsSrc}
            srcLang={project.captionsLang || "en-GB"}
            label="English captions"
            default
          />
        )}
      </video>
      {project.duration && (
        <p className="mt-2 text-xs font-semibold text-zinc-600">Duration: {project.duration}</p>
      )}
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        {project.videoDescription || project.description}
      </p>
    </div>
  );
}

export default function BeforeAfterGallery({ projects = CLEANING_PROJECTS }) {
  const publishedProjects = projects.filter(isPublishableCleaningProject);

  return (
    <section aria-labelledby="before-after-heading" className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 id="before-after-heading" className="text-2xl font-semibold text-zinc-950 sm:text-3xl">
            Before &amp; After: Real Cleaning Results
          </h2>
          <p className="mt-4 leading-7 text-zinc-600">
            See real before-and-after cleaning work completed by the Apex Five Cleaning team. Every project is shown with permission and presented without sharing customers’ personal details.
          </p>
          <p className="mt-3 text-sm text-zinc-600">
            Projects are shared with customer permission. Personal details are not displayed.
          </p>
        </div>

        {publishedProjects.length ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {publishedProjects.map((project) => (
              <article key={project.id} className="min-w-0 border-t-2 border-brand-600 pt-4">
                <ProjectMedia project={project} />
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-zinc-950">{project.title}</h3>
                  <p className="mt-1 text-sm font-medium text-brand-700">
                    {project.serviceType} <span aria-hidden="true">·</span> {project.location}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{project.description}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-10 border-l-2 border-brand-600 py-2 pl-4 text-zinc-700">
            Real before-and-after projects are being added shortly.
          </p>
        )}
      </div>
    </section>
  );
}