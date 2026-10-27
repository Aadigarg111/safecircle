import { Phone, MessageCircle } from 'lucide-react'

const HELPLINES = [
  { name: 'Emergency', number: '112', description: 'All emergencies', emoji: '🆘', color: 'bg-red-500' },
  { name: 'Women Helpline', number: '1091', description: 'Women in distress', emoji: '👩', color: 'bg-pink-500' },
  { name: 'Women Helpline', number: '181', description: 'State women helpline', emoji: '🌸', color: 'bg-rose-500' },
  { name: 'Police', number: '100', description: 'Police control room', emoji: '🚔', color: 'bg-blue-500' },
  { name: 'Child Helpline', number: '1098', description: 'Child in distress', emoji: '👶', color: 'bg-green-500' },
  { name: 'Ambulance', number: '102', description: 'Medical emergency', emoji: '🚑', color: 'bg-orange-500' },
  { name: 'Senior Citizen', number: '14567', description: 'Elder helpline', emoji: '👴', color: 'bg-purple-500' },
  { name: 'Cyber Crime', number: '1930', description: 'Online crime helpline', emoji: '💻', color: 'bg-teal-500' },
]

export default function HelplineHub() {
  const handleCall = (number: string) => {
    window.open(`tel:${number}`, '_self')
  }

  const handleSMS = (number: string) => {
    const msg = encodeURIComponent(`🆘 I need help! Please send assistance. Sent via SafeCircle.`)
    window.open(`sms:${number}?body=${msg}`, '_self')
  }

  return (
    <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
      {HELPLINES.map(line => (
        <div key={line.number} className="card p-3 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${line.color}`}>
            {line.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{line.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{line.description}</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleCall(line.number)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${line.color} hover:opacity-90 transition-opacity`}
              title={`Call ${line.number}`}
            >
              <Phone size={16} />
            </button>
            <button
              onClick={() => handleSMS(line.number)}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-colors"
              title="Send SMS"
            >
              <MessageCircle size={16} />
            </button>
          </div>
        </div>
      ))}
      <div className="pt-2 pb-1">
        <p className="text-xs text-slate-400 text-center">
          All helplines are free to call 24/7 across India
        </p>
      </div>
    </div>
  )
}
