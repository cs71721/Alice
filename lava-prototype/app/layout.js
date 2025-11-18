import './globals.css'

export const metadata = {
  title: 'Lava - Collaborative Document Editor',
  description: 'A collaborative document editor with real-time chat and AI assistance',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
