import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

const datasourceUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: datasourceUrl ? datasourceUrl : env('DATABASE_URL'),
  },
})
