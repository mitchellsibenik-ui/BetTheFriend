import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/',
    error: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          console.log('🔐 Auth attempt:', { email: credentials?.email, hasPassword: !!credentials?.password })
          
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Missing credentials')
            return null
          }

          // Find user by email (case-insensitive search)
          const normalizedEmail = credentials.email.toLowerCase().trim()
          const originalEmail = credentials.email.trim()
          
          console.log('🔍 Searching for user with email:', { normalizedEmail, originalEmail })
          
          // Try exact match with normalized email first (most common case)
          let user = await prisma.user.findUnique({
            where: {
              email: normalizedEmail
            }
          })
          
          console.log('   First attempt (normalized):', user ? `Found ${user.username}` : 'Not found')
          
          // If not found, try original case
          if (!user) {
            user = await prisma.user.findUnique({
              where: {
                email: originalEmail
              }
            })
            console.log('   Second attempt (original):', user ? `Found ${user.username}` : 'Not found')
          }
          
          // If still not found, try case-insensitive search
          if (!user) {
            console.log('   Third attempt: Searching all users...')
            const allUsers = await prisma.user.findMany({
              select: { id: true, email: true, username: true, password: true, balance: true, wins: true, losses: true, name: true, image: true }
            })
            user = allUsers.find(u => u.email.toLowerCase() === normalizedEmail)
            console.log('   Found in all users:', user ? `Found ${user.username} (${user.email})` : 'Not found')
            if (user) {
              console.log('   Matched email:', user.email, 'to normalized:', normalizedEmail)
            }
          }

          if (!user) {
            console.log('❌ User not found after all attempts:', credentials.email)
            return null
          }

          if (!user?.password) {
            console.log('❌ User has no password:', user.username)
            return null
          }

          console.log('✅ User found:', user.username, 'Email:', user.email)
          console.log('🔑 Comparing password...')

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log('   Password comparison result:', isCorrectPassword)

          if (!isCorrectPassword) {
            console.log('❌ Password incorrect for user:', user.username)
            return null
          }

          console.log('✅ Password correct, returning user:', user.username)
          return {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            image: user.image,
            balance: user.balance,
            wins: user.wins,
            losses: user.losses
          }
        } catch (error) {
          console.error('❌ Auth error:', error)
          console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          username: user.username,
          balance: user.balance,
          wins: user.wins,
          losses: user.losses
        }
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          username: token.username,
          balance: token.balance,
          wins: token.wins,
          losses: token.losses
        }
      }
    },
    async redirect({ url, baseUrl }) {
      // Handle logout redirect
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      } else if (new URL(url).origin === baseUrl) {
        return url
      }
      return baseUrl
    }
  },
  events: {
    async signOut() {
      // Handle any cleanup needed on sign out
    }
  }
} 