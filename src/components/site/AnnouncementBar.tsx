export const AnnouncementBar = ({ text }: { text?: string | null }) => {
  if (!text) return null
  return (
    <div className="bg-navy-900 text-white text-xs sm:text-sm">
      <div className="container-page py-2 text-center font-medium">{text}</div>
    </div>
  )
}
