// Shared scroll reveal animation config - use with framer-motion
// amount: 0 = trigger as soon as any part is in view (fixes mobile "scroll to see content")
export const scrollReveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
}

// Use for page wrapper so content is visible immediately (no wait for scroll on mobile)
export const scrollRevealVisible = {
  initial: { opacity: 1, y: 0 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0 },
}

export const staggerContainer = {
  initial: {},
  whileInView: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
  viewport: { once: true, amount: 0.1 },
}

export const staggerItem = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
  viewport: { once: true },
}
