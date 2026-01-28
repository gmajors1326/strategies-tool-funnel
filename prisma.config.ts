import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

const withRequiredSsl = (value?: string) => {
  if (!value) return value
  if (value.includes('sslmode=')) return value
  const separator = value.includes('?') ? '&' : '?'
  return `${value}${separator}sslmode=require`
}

const preferPooler =
  process.env.PRISMA_MIGRATE_USE_POOLER === 'true' ||
  process.env.PRISMA_CLI_USE_POOLER === 'true'

const directUrl = process.env.DIRECT_URL || process.env.POSTGRES_URL_NON_POOLING
const pooledUrl = process.env.DATABASE_URL

const datasourceUrl = withRequiredSsl(
  preferPooler ? pooledUrl || directUrl : directUrl || pooledUrl
)

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: datasourceUrl ? datasourceUrl : env('DATABASE_URL'),
  },
})
