import { Prisma } from '@/src/generated/prisma/client'
import { prisma } from '@/src/lib/prisma'

export type ProviderError = {
  code: 'PROVIDER_ERROR'
  message: string
  details?: any
}

export class ProviderErrorException extends Error {
  public readonly code = 'PROVIDER_ERROR' as const
  public readonly details?: any

  constructor(message: string, details?: any) {
    super(message)
    this.name = 'ProviderErrorException'
    this.details = details
  }
}

let _dbReadyChecked = false

/**
 * Dev-only DB schema check (runs once per server process).
 * Prevents “click a page -> Prisma blows up” by failing fast with actionable instructions.
 *
 * Zero bloat: one query, one throw, dev only.
 */
export async function assertDbReadyOnce() {
  if (process.env.NODE_ENV === 'production') return
  if (_dbReadyChecked) return

  // Postgres: check required tables exist
  // NOTE: table names are case-sensitive if quoted. Prisma typically creates PascalCase table names if you mapped them.
  // Your error shows: public.Entitlement (PascalCase), so we check that.
  const requiredTables = ['Entitlement']

  try {
    const rows = (await prisma.$queryRaw<
      Array<{ table_name: string; exists: boolean }>
    >`
      select t.table_name,
             (to_regclass('public.' || t.table_name) is not null) as exists
      from (select unnest(${requiredTables}::text[]) as table_name) t
    `) as Array<{ table_name: string; exists: boolean }>

    const missing = rows.filter((r) => !r.exists).map((r) => r.table_name)

    if (missing.length) {
      throw new ProviderErrorException(
        `Database is missing required tables: ${missing.join(', ')}.`,
        {
          missing,
          fix:
            'Run `npx prisma migrate dev` (preferred) or `npx prisma db push` (dev only), then refresh.',
        }
      )
    }

    _dbReadyChecked = true
  } catch (err: any) {
    // If even the check fails, normalize it too
    throw normalizePrismaError(err)
  }
}

/**
 * Normalizes Prisma/DB errors into a clean PROVIDER_ERROR you can return from APIs
 * instead of crashing pages.
 */
export function normalizePrismaError(err: any): ProviderErrorException {
  // Prisma known errors sometimes use codes like P2021 (table does not exist)
  const known = err instanceof Prisma.PrismaClientKnownRequestError
  const code = known ? err.code : undefined
  const msg = String(err?.message || err)

  // The exact error you showed: “The table `public.Entitlement` does not exist…”
  const looksLikeMissingTable =
    code === 'P2021' ||
    /The table `public\./i.test(msg) ||
    /does not exist in the current database/i.test(msg)

  if (looksLikeMissingTable) {
    return new ProviderErrorException(
      'Database schema is out of date (missing table). Apply Prisma migrations.',
      {
        prismaCode: code,
        rawMessage: msg,
        fix: 'Run `npx prisma migrate dev` (preferred) or `npx prisma db push` (dev only).',
      }
    )
  }

  // Connection-ish errors / provider errors
  const looksLikeConnection =
    /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|server closed the connection|Connection terminated/i.test(msg)

  if (looksLikeConnection) {
    return new ProviderErrorException('Database connection failed.', {
      rawMessage: msg,
      fix: 'Verify DATABASE_URL and that the DB is reachable.',
    })
  }

  // Default provider error wrapper
  return new ProviderErrorException('Database operation failed.', {
    rawMessage: msg,
    prismaCode: code,
  })
}

export function isProviderError(err: any): err is ProviderErrorException {
  return err instanceof ProviderErrorException || err?.code === 'PROVIDER_ERROR'
}
