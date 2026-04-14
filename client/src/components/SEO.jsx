import { Helmet } from "react-helmet-async";
import { SITE_NAME, SITE_URL } from "../config/site";

const DEFAULT_IMAGE = `${SITE_URL}/apex-five-logo.png`;

const buildAbsoluteUrl = (path = "/") => {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
};

const SEO = ({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  jsonLd = [],
}) => {
  const absoluteUrl = buildAbsoluteUrl(path);
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const schemaList = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={absoluteUrl} />

      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={absoluteUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {schemaList
        .filter(Boolean)
        .map((schema, index) => (
          <script key={`schema-${index}`} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
    </Helmet>
  );
};

export default SEO;
