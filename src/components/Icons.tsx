type IconProps = {
  className?: string
}

export function CheckIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10.4 3.1 3.1L15.4 6" /></svg>
}

export function PlusIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
}

export function CloseIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>
}

export function EditIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="m14.7 6.3 3 3M5 19l3.6-.7L18 8.9a1.4 1.4 0 0 0 0-2l-.9-.9a1.4 1.4 0 0 0-2 0l-9.4 9.4L5 19Z" /></svg>
}

export function HomeIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" /></svg>
}

export function GoalIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4v16M5 5h11l-2 3 2 3H5" /></svg>
}

export function HelpIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.3a2.5 2.5 0 1 1 4 2c-.9.7-1.6 1.1-1.6 2.3M12 16.7h.01" /></svg>
}
