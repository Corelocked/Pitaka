function BaseIcon({ className = '', size = 20, children }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function ChevronLeftIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  )
}

export function ChevronRightIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  )
}

export function LogoutIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  )
}

export function HomeIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M3 10.5L12 3L21 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20C5 20.5523 5.44772 21 6 21H10V15H14V21H18C18.5523 21 19 20.5523 19 20V9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  )
}

export function ActivityIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M3 12H7L10 5L14 19L17 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  )
}

export function WalletIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M16 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="12" r="1" fill="currentColor" />
    </BaseIcon>
  )
}

export function ChartIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M4 20H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 16V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 16V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </BaseIcon>
  )
}

export function SettingsIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15A1.7 1.7 0 0 0 19.74 16.87L19.8 16.93A2 2 0 0 1 16.97 19.76L16.91 19.7A1.7 1.7 0 0 0 15.04 19.36A1.7 1.7 0 0 0 14 20.91V21A2 2 0 1 1 10 21V20.91A1.7 1.7 0 0 0 8.96 19.36A1.7 1.7 0 0 0 7.09 19.7L7.03 19.76A2 2 0 1 1 4.2 16.93L4.26 16.87A1.7 1.7 0 0 0 4.6 15.04A1.7 1.7 0 0 0 3.09 14H3A2 2 0 1 1 3 10H3.09A1.7 1.7 0 0 0 4.6 8.96A1.7 1.7 0 0 0 4.26 7.09L4.2 7.03A2 2 0 1 1 7.03 4.2L7.09 4.26A1.7 1.7 0 0 0 8.96 4.6H9A1.7 1.7 0 0 0 10 3.09V3A2 2 0 1 1 14 3V3.09A1.7 1.7 0 0 0 15.04 4.6A1.7 1.7 0 0 0 16.91 4.26L16.97 4.2A2 2 0 1 1 19.8 7.03L19.74 7.09A1.7 1.7 0 0 0 19.4 8.96V9A1.7 1.7 0 0 0 20.91 10H21A2 2 0 1 1 21 14H20.91A1.7 1.7 0 0 0 19.4 15Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  )
}

export function IncomeIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M12 20V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 10L12 5L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  )
}

export function ExpenseIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M12 4V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 14L12 19L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  )
}

export function TransferIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M16 3L21 8L16 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 8H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 11L3 16L8 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </BaseIcon>
  )
}

export function CategoryIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M3 12L12 3L21 12L12 21L3 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </BaseIcon>
  )
}

export function DownloadIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M12 4V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </BaseIcon>
  )
}

export function UploadIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M12 20V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 14L12 9L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 4H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </BaseIcon>
  )
}

export function TemplateIcon(props) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 16H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </BaseIcon>
  )
}

export function TrendUpIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M4 16L10 10L13 13L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 6H20V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  )
}

export function TrashIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 7V5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 7L8 20C8.07754 21.0072 8.9174 21.7857 9.92757 21.7857H14.0724C15.0826 21.7857 15.9225 21.0072 16 20L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </BaseIcon>
  )
}

export function EditIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M12 20H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.5 3.5C17.3284 2.67157 18.6716 2.67157 19.5 3.5C20.3284 4.32843 20.3284 5.67157 19.5 6.5L8 18L3 19L4 14L16.5 3.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  )
}

export function FolderIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M3 7C3 5.89543 3.89543 5 5 5H9L11 7H19C20.1046 7 21 7.89543 21 9V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </BaseIcon>
  )
}

export function CartIcon(props) {
  return (
    <BaseIcon {...props}>
      <circle cx="9" cy="20" r="1.5" fill="currentColor" />
      <circle cx="17" cy="20" r="1.5" fill="currentColor" />
      <path d="M3 4H5L7.5 15H18.5L21 8H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  )
}

export function HandshakeIcon(props) {
  return (
    <BaseIcon {...props}>
      <path d="M8 10L11 13C11.5523 13.5523 12.4477 13.5523 13 13L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 8L8 4L11 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 8L16 4L13 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16L8 20L11 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16L16 20L13 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  )
}
