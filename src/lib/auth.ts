import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'd3jZKGKbrKkugEQhU+gQeOQ0BVy3B/o3JMawwp43nKY=',
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
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // Try exact match first, then case-insensitive
          let user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          // If not found, try lowercase
          if (!user) {
            const normalizedEmail = credentials.email.toLowerCase().trim()
            user = await prisma.user.findUnique({
              where: {
                email: normalizedEmail
              }
            })
          }

          // If still not found, try original case trimmed
          if (!user) {
            user = await prisma.user.findUnique({
              where: {
                email: credentials.email.trim()
              }
            })
          }

          if (!user || !user?.password) {
            return null
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isCorrectPassword) {
            return null
          }

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
          console.error('Auth error:', error)
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
