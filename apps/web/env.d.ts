declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string
    UPSTASH_REDIS_REST_URL: string
    UPSTASH_REDIS_REST_TOKEN: string
    AWS_REGION: string
    AWS_ACCESS_KEY_ID: string
    AWS_SECRET_ACCESS_KEY: string
    AWS_BUCKET_NAME: string
    [key: string]: string | undefined
  }
}
