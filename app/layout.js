export const metadata = {
  title: 'PlateUp — 30 Fenchurch Street',
  description: 'Kitchen & Hospitality Production Sheets',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#0a0f1e',
        minHeight: '100vh',
        fontFamily: 'sans-serif'
      }}>
        {children}
      </body>
    </html>
  )
}
