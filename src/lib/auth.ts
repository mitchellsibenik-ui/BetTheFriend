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
        console.log('[AUTH] Login attempt for:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials')
          throw new Error('Invalid credentials')
        }

        console.log('[AUTH] Looking up user with email:', credentials.email)
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          console.log('[AUTH] User not found')
          throw new Error('No user found with this email')
        }

        if (!user?.password) {
          console.log('[AUTH] User has no password')
          throw new Error('No user found with this email')
        }

        console.log('[AUTH] User found:', user.username, 'Comparing password...')
        console.log('[AUTH] Password length received:', credentials.password.length)
        console.log('[AUTH] Password hash in DB:', user.password.substring(0, 20) + '...')
        
        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        console.log('[AUTH] Password comparison result:', isCorrectPassword)

        if (!isCorrectPassword) {
          console.log('[AUTH] Password incorrect')
          throw new Error('Incorrect password')
        }

        console.log('[AUTH] Login successful for:', user.username)

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
