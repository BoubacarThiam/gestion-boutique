export default function Badge({ classe = 'bg-gray-100 text-gray-700', children }) {
  return <span className={`etiquette ${classe}`}>{children}</span>
}
