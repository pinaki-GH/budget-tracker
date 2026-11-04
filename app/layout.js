import '../styles/globals.css'

export const metadata = {
  title: 'Budget Tracker',
  description: 'Financial Planning and Budget Tracking'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
