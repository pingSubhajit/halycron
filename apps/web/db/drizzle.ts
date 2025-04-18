import {config} from 'dotenv'
import {neon} from '@neondatabase/serverless'
import {drizzle} from 'drizzle-orm/neon-http'
import * as schema from '@/db/schema'
import * as relations from '@/db/relations'

config({path: '.env.local'})

const sql = neon(process.env.DATABASE_URL!)

export const db = drizzle(sql, {schema: {...schema, ...relations}})
