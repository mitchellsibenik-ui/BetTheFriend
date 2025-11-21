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
        const startTime = Date.now()
        const logPrefix = '[AUTH]'
        
        try {
          // Step 1: Validate credentials received
          console.log(`${logPrefix} [${Date.now()}] Received credentials:`, {
            hasEmail: !!credentials?.email,
            emailLength: credentials?.email?.length,
            hasPassword: !!credentials?.password,
            passwordLength: credentials?.password?.length
          })
          
          if (!credentials?.email || !credentials?.password) {
            console.log(`${logPrefix} [${Date.now()}] ❌ Missing credentials`)
            return null
          }

          // Step 2: Normalize and search for user
          const normalizedEmail = credentials.email.toLowerCase().trim()
          const originalEmail = credentials.email.trim()
          
          console.log(`${logPrefix} [${Date.now()}] Searching for user:`, {
            normalizedEmail,
            originalEmail
          })
          
          // Try normalized email first (most common case)
          let user = await prisma.user.findUnique({
            where: {
              email: normalizedEmail
            }
          })
          
          console.log(`${logPrefix} [${Date.now()}] Normalized search result:`, user ? `Found ${user.username}` : 'Not found')
          
          // If not found, try original case
          if (!user) {
            user = await prisma.user.findUnique({
              where: {
                email: originalEmail
              }
            })
            console.log(`${logPrefix} [${Date.now()}] Original case search result:`, user ? `Found ${user.username}` : 'Not found')
          }

          // Step 3: Validate user found and has password
          if (!user) {
            console.log(`${logPrefix} [${Date.now()}] ❌ User not found for email: ${credentials.email}`)
            return null
          }

          if (!user.password) {
            console.log(`${logPrefix} [${Date.now()}] ❌ User ${user.username} has no password`)
            return null
          }

          console.log(`${logPrefix} [${Date.now()}] ✅ User found: ${user.username} (${user.email})`)

          // Step 4: Compare password
          console.log(`${logPrefix} [${Date.now()}] Comparing password...`)
          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log(`${logPrefix} [${Date.now()}] Password comparison result:`, isCorrectPassword ? '✅ VALID' : '❌ INVALID')

          if (!isCorrectPassword) {
            console.log(`${logPrefix} [${Date.now()}] ❌ Password incorrect for user: ${user.username}`)
            return null
          }

          // Step 5: Return user object for session creation
          const userObject = {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
            image: user.image,
            balance: user.balance,
            wins: user.wins,
            losses: user.losses
          }
          
          const duration = Date.now() - startTime
          console.log(`${logPrefix} [${Date.now()}] ✅ Login successful for ${user.username} (${duration}ms)`)
          
          return userObject
        } catch (error) {
          const duration = Date.now() - startTime
          console.error(`${logPrefix} [${Date.now()}] ❌ Auth error after ${duration}ms:`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            email: credentials?.email
          })
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
      // Ensure all user data is properly attached to session
      if (token && session.user) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.id as string,
            username: token.username as string,
            balance: token.balance as number,
            wins: token.wins as number,
            losses: token.losses as number
          }
        }
      }
      return session
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