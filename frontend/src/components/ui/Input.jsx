export function TextInput({ label, id, as = 'input', error, className = '', ...props }) {
  const FieldTag = as

  return (
    <label className={`group relative block ${className}`} htmlFor={id}>
      <FieldTag
        id={id}
        placeholder=" "
        className="peer h-16 w-full rounded-3xl border border-white/10 bg-slate-950/70 px-4 pb-2 pt-8 text-base text-slate-100 outline-none transition duration-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 sm:text-sm"
        rows={as === 'textarea' ? 4 : undefined}
        {...props}
      />
      <span className="pointer-events-none absolute left-4 top-4 origin-left text-sm text-slate-400 transition-all duration-200 peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-focus:-top-2 peer-focus:text-xs peer-focus:text-emerald-300">
        {label}
      </span>
      {error ? <p className="mt-2 text-sm text-rose-400">{error}</p> : null}
    </label>
  )
}
