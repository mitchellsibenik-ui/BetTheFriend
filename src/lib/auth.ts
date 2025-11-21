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
          console.log('🔐 Auth attempt:', { email: credentials?.email })
          
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Missing credentials')
            throw new Error('Invalid credentials')
          }

          // Find user by email (case-insensitive search)
          const normalizedEmail = credentials.email.toLowerCase().trim()
          const originalEmail = credentials.email.trim()
          
          // Try to find user with either email format
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: normalizedEmail },
                { email: originalEmail }
              ]
            }
          })
          
          // If still not found, try case-insensitive search using findMany
          if (!user) {
            const allUsers = await prisma.user.findMany({
              where: {
                email: {
                  contains: normalizedEmail,
                  mode: 'insensitive'
                }
              }
            })
            user = allUsers.find(u => u.email.toLowerCase() === normalizedEmail) || allUsers[0]
          }

          if (!user) {
            console.log('❌ User not found:', credentials.email)
            throw new Error('No user found with this email')
          }

          if (!user?.password) {
            console.log('❌ User has no password')
            throw new Error('No user found with this email')
          }

          console.log('✅ User found:', user.username)
          console.log('🔑 Comparing password...')

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isCorrectPassword) {
            console.log('❌ Password incorrect')
            throw new Error('Incorrect password')
          }

          console.log('✅ Password correct, returning user')
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
          throw error
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