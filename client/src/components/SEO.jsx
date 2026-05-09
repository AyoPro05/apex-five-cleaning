import { Helmet } from "react-helmet-async";
import { SITE_NAME, SITE_URL } from "../config/site";

const DEFAULT_IMAGE = `${SITE_URL}/apex-five-logo.png`;
const DEFAULT_DESCRIPTION =
  "Apex Five Cleaning provides trusted eco-friendly residential, tenancy, Airbnb, and commercial cleaning services across Kent, Essex, and Greater London.";

const buildAbsoluteUrl = (path = "/") => {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
};

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  jsonLd = [],
}) => {
  const absoluteUrl = buildAbsoluteUrl(path);
  const absoluteImageUrl = buildAbsoluteUrl(image);
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const schemaList = Array.isArray(jsonLd) ? jsonLd : [jsonLd];

  return (
    <Helmet>
      <meta charSet="utf-8" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={absoluteUrl} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={absoluteUrl} />
      <meta property="og:image" content={absoluteImageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_GB" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImageUrl} />
      <meta name="twitter:url" content={absoluteUrl} />

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
