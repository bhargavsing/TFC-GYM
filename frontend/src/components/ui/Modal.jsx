import { AnimatePresence, motion } from 'framer-motion'

export function Modal({ open, title, description, children, onClose }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.25 }} className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-slate-950/95 p-6 shadow-[0_35px_120px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">{title}</p>
                {description ? <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p> : null}
              </div>
              <button onClick={onClose} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-100 transition hover:bg-white/10">Close</button>
            </div>
            <div className="mt-6">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
