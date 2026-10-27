import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'

interface PageHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  right?: React.ReactNode
  className?: string
}

export default function PageHeader({ title, subtitle, onBack, right, className }: PageHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  return (
    <header
      className={clsx(
        'flex items-center gap-3 px-4 py-3',
        'bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800',
        className,
      )}
    >
      {onBack !== undefined && (
        <button onClick={handleBack} className="btn-ghost p-1.5 -ml-1">
          <ArrowLeft size={20} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="font-bold text-lg text-slate-800 dark:text-white truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </header>
  )
}
