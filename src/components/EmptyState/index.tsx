import './EmptyState.css'

type EmptyStateProps = {
  text: string
  title: string
}

export function EmptyState({ text, title }: EmptyStateProps) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  )
}
