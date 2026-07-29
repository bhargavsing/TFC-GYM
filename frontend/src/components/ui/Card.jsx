import { motion } from 'framer-motion'

export function Card({ className = '', children, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_35px_120px_rgba(0,0,0,0.18)] backdrop-blur-xl ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
