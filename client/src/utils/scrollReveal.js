// Shared scroll reveal animation config - use with framer-motion
export const scrollReveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.6, ease: 'easeOut' },
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
