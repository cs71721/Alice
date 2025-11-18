import './globals.css'

export const metadata = {
  title: 'Lava - Collaborative Document Editor',
  description: 'A collaborative document editor with real-time chat and AI assistance',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
