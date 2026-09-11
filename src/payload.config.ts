import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { resendAdapter } from '@payloadcms/email-resend'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Customers } from './collections/Customers'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Brands } from './collections/Brands'
import { Products } from './collections/Products'
import { Orders } from './collections/Orders'
import { ServiceTypes } from './collections/ServiceTypes'
import { ServiceRequests } from './collections/ServiceRequests'
import { Pages } from './collections/Pages'
import { SiteSettings } from './globals/SiteSettings'
import { Homepage } from './globals/Homepage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const hasS3 = Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID)
const hasResend = Boolean(process.env.RESEND_API_KEY)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      title: 'Alert Eye Electronics',
      description: 'Sales & service administration',
    },
    components: {
      graphics: {
        Logo: '/components/admin/Logo#Logo',
        Icon: '/components/admin/Icon#Icon',
      },
    },
  },
  collections: [
    Products,
    Categories,
    Brands,
    Media,
    Orders,
    Customers,
    ServiceTypes,
    ServiceRequests,
    Pages,
    Users,
  ],
  globals: [Homepage, SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
  }),
  sharp,
  cors: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'].filter(Boolean),
  csrf: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'].filter(Boolean),
  email: hasResend
    ? resendAdapter({
        defaultFromAddress: (process.env.EMAIL_FROM || 'noreply@alerteye.co.ke').replace(/.*<(.+)>.*/, '$1'),
        defaultFromName: 'Alert Eye Electronics',
        apiKey: process.env.RESEND_API_KEY as string,
      })
    : undefined,
  plugins: [
    ...(hasS3
      ? [
          s3Storage({
            collections: { media: { prefix: 'media' } },
            bucket: process.env.S3_BUCKET as string,
            config: {
              region: process.env.S3_REGION || 'auto',
              endpoint: process.env.S3_ENDPOINT,
              forcePathStyle: true,
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
              },
            },
          }),
        ]
      : []),
  ],
})
