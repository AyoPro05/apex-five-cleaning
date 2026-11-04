import { useId } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { CUSTOMER_REVIEWS } from "../data/customerReviews";
import { scrollReveal } from "../utils/scrollReveal";

export default function CustomerReviews({ reviews = CUSTOMER_REVIEWS }) {
  const headingId = useId();
  const verifiedReviews = reviews.filter((review) => review.verified === true);

  if (verifiedReviews.length === 0) return null;

  return (
    <motion.section
      aria-labelledby={headingId}
      className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 mb-16"
      {...scrollReveal}
    >
      <h2 id={headingId} className="text-2xl font-bold text-gray-900 mb-6">
        What Our Customers Say
      </h2>
      <div className="grid gap-8 lg:grid-cols-3">
        {verifiedReviews.map((review) => {
          const hasRating = Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5;

          return (
            <figure key={review.id} className="min-w-0">
              {hasRating && (
                <div
                  role="img"
                  aria-label={`${review.rating} out of 5 stars`}
                  className="flex gap-1 mb-4"
                >
                  {Array.from({ length: review.rating }, (_, index) => (
                    <Star key={index} aria-hidden="true" className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              )}
              <blockquote className="text-gray-600 italic leading-relaxed whitespace-pre-wrap break-words mb-4">
                {review.text}
              </blockquote>
              <figcaption>
                <p className="font-semibold text-gray-900">{review.authorDisplayName}</p>
                {review.sourceUrl ? (
                  <a
                    href={review.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Read ${review.authorDisplayName}'s review on ${review.source}`}
                    className="inline-flex items-center min-h-11 text-sm font-semibold text-teal-700 underline underline-offset-4 hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                  >
                    Read review on {review.source}
                  </a>
                ) : (
                  <p className="text-sm text-gray-600">{review.source}</p>
                )}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </motion.section>
  );
}
