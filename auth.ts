import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import type { NextAuthOptions as NextAuthConfig, User } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Read more at: https://next-auth.js.org/getting-started/typescript#module-augmentation
declare module "next-auth/jwt" {
  interface JWT {
    admin?: boolean | null;
  }
}

declare module "next-auth" {
  interface User {
    admin?: boolean | null;
    username?: string | null;
  }

  interface Session {
    user: User;
  }
}

export const config = {
  providers: [
    Credentials({
      id: 'username-signin',
      name: "Username",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "admin",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (credentials?.username) {
          const user =  {
            id: credentials.username,
            username: credentials.username,
            admin: false
          } as User;

          if (credentials.username === 'admin') {
            user.admin = true
          }

          return user
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      token.sub = token.sub ?? user.id
      token.admin = token.admin ?? user.admin

      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        admin: token.admin,
        username: token.sub,
      }

      return session
    }
  },
  session: {
    strategy: 'jwt',
  }

} satisfies NextAuthConfig;

// Helper function to get session without passing config every time
// https://next-auth.js.org/configuration/nextjs#getserversession
export function auth(
  ...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, config);
}

// We recommend doing your own environment variable validation
declare global {
  namespace NodeJS {
    export interface ProcessEnv {
      NEXTAUTH_SECRET: string;
    }
  }
}
