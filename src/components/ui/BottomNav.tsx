import { NavLink } from 'react-router-dom'
import { Map, Users, AlertTriangle, Bell, User } from 'lucide-react'
import { useStore } from '@/store'
import clsx from 'clsx'

const tabs = [
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/circle', icon: Users, label: 'Circle' },
  { to: '/sos', icon: AlertTriangle, label: 'SOS' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const unreadAlertCount = useStore(s => s.unreadAlertCount)

  return (
    <nav className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 safe-bottom">
      <div className="flex items-center justify-around">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-1 px-3 py-3 min-w-[60px] transition-colors duration-150',
                isActive
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400',
              )
            }
          >
            <div className="relative">
              <Icon size={22} strokeWidth={1.8} />
              {label === 'Alerts' && unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
