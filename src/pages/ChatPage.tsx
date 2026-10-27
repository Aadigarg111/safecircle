import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { useStore } from '@/store'
import { dataService } from '@/services'
import { showToast } from '@/components/ui/Toast'
import PageHeader from '@/components/ui/PageHeader'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

const QUICK_REPLIES = [
  'I reached safely ✅',
  'On my way 🚶',
  'Need help 🆘',
  'Call me 📞',
  'Running late ⏰',
  'I\'m at home 🏠',
]

export default function ChatPage() {
  const user = useStore(s => s.user)
  const messages = useStore(s => s.messages)
  const setMessages = useStore(s => s.setMessages)
  const addMessage = useStore(s => s.addMessage)
  const activeCircleId = useStore(s => s.activeCircleId)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeCircleId) return
    dataService.getMessages(activeCircleId).then(setMessages)
    const unsub = dataService.subscribeToMessages(activeCircleId, msg => {
      if (msg.userId !== user?.id) addMessage(msg)
    })
    return unsub
  }, [activeCircleId, setMessages, addMessage, user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (content: string, isQuick = false) => {
    if (!content.trim() || !activeCircleId || sending) return
    setSending(true)
    try {
      const msg = await dataService.sendMessage(activeCircleId, content, isQuick)
      addMessage(msg)
      setText('')
    } catch (e) {
      showToast({ type: 'error', title: 'Failed to send', message: String(e) })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <PageHeader title="Circle Chat" subtitle="Family messages" />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map(msg => {
          const isOwn = msg.userId === user?.id
          return (
            <div key={msg.id} className={clsx('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
              {!isOwn && (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm flex-shrink-0">
                  {msg.userAvatar}
                </div>
              )}
              <div className={clsx('max-w-[75%] space-y-1', isOwn ? 'items-end' : 'items-start', 'flex flex-col')}>
                {!isOwn && (
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">{msg.userName.split(' ')[0]}</span>
                )}
                <div
                  className={clsx(
                    'px-3 py-2 rounded-2xl text-sm',
                    isOwn
                      ? 'bg-red-500 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm shadow-sm',
                    msg.isQuickReply && 'border-2 border-green-400',
                  )}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-slate-400 mx-1">
                  {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                </span>
              </div>
            </div>
          )
        })}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <MessageCircle size={40} className="opacity-30 mb-2" />
            <p className="text-sm">No messages yet. Say hi! 👋</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {QUICK_REPLIES.map(r => (
          <button
            key={r}
            onClick={() => handleSend(r, true)}
            className="flex-shrink-0 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors"
          >
            {r}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-3 flex gap-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pt-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend(text)}
          className="input flex-1"
          placeholder="Type a message..."
        />
        <button
          onClick={() => handleSend(text)}
          disabled={!text.trim() || sending}
          className="btn-primary px-4 py-2"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
