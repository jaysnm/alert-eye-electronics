import { MessageCircle } from 'lucide-react'
import { waLink } from '@/lib/format'

export const WhatsAppButton = ({ phone }: { phone?: string | null }) => {
  if (!phone) return null
  return (
    <a
      href={waLink(phone, 'Hello Alert Eye Electronics, I have an enquiry.')}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] text-white px-4 py-3 shadow-lg hover:brightness-95"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={20} />
      <span className="hidden sm:inline font-semibold text-sm">Chat with us</span>
    </a>
  )
}
