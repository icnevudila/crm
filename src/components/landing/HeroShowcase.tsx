import { memo } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'

function HeroShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
        className="relative overflow-hidden rounded-[26px] border border-white/12 bg-white/75 p-6 shadow-[0_45px_95px_-40px_rgba(12,22,45,0.6)] backdrop-blur-2xl lg:p-8 dark:border-slate-800/70 dark:bg-slate-900/70"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500" />
            <span className="h-3 w-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-500" />
            <span className="h-3 w-3 rounded-full bg-gradient-to-br from-rose-400 to-rose-500" />
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-100/85 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:bg-slate-800/70 dark:text-slate-200">
            <Sparkles className="h-3.5 w-3.5" />
            Canlı izleme aktif
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-inner dark:border-slate-800/60 dark:bg-slate-900/65">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-300">
                  Pipeline sağlığı
                </p>
                <div className="flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] font-medium text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-200">
                  <TrendingUp className="h-3.5 w-3.5" />
                  %32 büyüme
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  { label: 'Yeni fırsat', value: 86, color: 'from-indigo-500 via-purple-500 to-pink-500' },
                  { label: 'Teklif aşaması', value: 74, color: 'from-cyan-500 via-indigo-500 to-purple-500' },
                  { label: 'Kapanışta', value: 63, color: 'from-emerald-500 via-teal-500 to-sky-500' },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-300">
                      <span>{metric.label}</span>
                      <span>%{metric.value}</span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${metric.value}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full bg-gradient-to-r ${metric.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/65 dark:text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-200">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Aktif kullanıcı
                  </p>
                  <p className="text-lg">1.248</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/65 dark:text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-200">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Dönüşüm artışı
                  </p>
                  <p className="text-lg">+%18</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5 text-white shadow-lg dark:border-indigo-500/40">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/75">
                Yapay zeka önerisi
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/95">
                "Yeni müşteri segmentinde fırsatlar %28 daha hızlı kapanıyor. Otomatik nurture kampanyasını başlatın."
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-white/70">
                <Sparkles className="h-4 w-4" />
                Gelişmiş içgörüler aktif
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/65">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Bugünkü takvim
                  </p>
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    6 toplantı • 3 teklif
                    <ArrowUpRight className="h-4 w-4 text-indigo-500" />
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-200">
                  <CalendarCheck2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  '10:00  | Demo hazırlık',
                  '12:30 | Fiyat revizyonu',
                  '15:00 | Kapanış toplantısı',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white/95 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-800/40 dark:bg-slate-900/55 dark:text-slate-200"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
        className="pointer-events-none absolute -top-10 -right-12 hidden rounded-3xl border border-white/20 bg-white/60 p-4 shadow-xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/65 lg:block"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
          Performans
        </p>
        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">+76%</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-300">Kapanan fırsat</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
        className="pointer-events-none absolute -bottom-12 -left-6 hidden rounded-3xl border border-indigo-200/35 bg-white/75 p-4 shadow-2xl backdrop-blur-xl dark:border-indigo-500/20 dark:bg-slate-900/60 lg:block"
      >
        <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">Memnuniyet</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">4.9</div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, idx) => (
              <span key={idx} className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            ))}
          </div>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-300">Son 12 ay</p>
      </motion.div>
    </div>
  )
}

export default memo(HeroShowcase)
