import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'

type LexicalData = React.ComponentProps<typeof LexicalRichText>['data']

export const RichText = ({ data, className }: { data: unknown; className?: string }) => {
  if (!data || typeof data !== 'object') return null
  return (
    <div className={className ?? 'prose-basic max-w-none text-slate-700'}>
      <LexicalRichText data={data as LexicalData} />
    </div>
  )
}
