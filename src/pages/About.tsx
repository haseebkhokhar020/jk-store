import { motion } from 'framer-motion'
import { Award, HeartHandshake, Leaf } from 'lucide-react'
import { useBranding } from '../lib/branding'

export default function About() {
  const { branding } = useBranding()
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <motion.h1 initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl font-bold sm:text-5xl">
        About <span className="brand-text">{branding?.store_name || 'JK Store'}</span>
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-6 leading-relaxed text-neutral-600">
        {branding?.store_name || 'JK Store'} is a {branding?.business_category?.toLowerCase() || 'cosmetics and beauty'} store founded and run by{' '}
        <strong>{branding?.owner_name || 'Jahanzaib Khan'}</strong>. We bring you premium, 100% herbal products — like the Dr. Zain Hair Care
        Range — that promote hair growth, reduce dandruff and nourish your scalp and roots. Healthy hair, stronger roots, natural care.
      </motion.p>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {[['Natural Care', Leaf, '100% herbal formulas, gentle and effective.'],
          ['Trusted Quality', Award, '4.9★ trustscore with thousands of happy customers.'],
          ['Customer First', HeartHandshake, 'Cash on Delivery and friendly support across Pakistan.'],
        ].map(([t, Icon, d], i) => (
          <motion.div key={t as string} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="rounded-2xl bg-white p-6 text-center shadow-card ring-1 ring-neutral-100">
            <Icon className="mx-auto brand-text" size={26} />
            <h3 className="mt-3 font-bold">{t as string}</h3>
            <p className="mt-1 text-sm text-neutral-500">{d as string}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
