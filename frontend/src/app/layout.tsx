import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/context/ThemeContext'
import { SocketProvider } from '@/context/SocketContext'
import { ChatProvider } from '@/context/ChatContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Anonymous Chat - Real-time Messaging',
  description: 'Join anonymous chat rooms and connect with people around the world in real-time.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <SocketProvider>
            <ChatProvider>
              <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 transition-all duration-300">
                {children}
              </div>
            </ChatProvider>
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}