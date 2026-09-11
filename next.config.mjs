import { withPayload } from '@payloadcms/next/withPayload'

const s3Url = process.env.NEXT_PUBLIC_S3_PUBLIC_URL

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  images: {
    // Local dev serves media from the Payload API on localhost (a private IP);
    // in production media is served from object storage (S3/R2).
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
      ...(s3Url ? [{ protocol: 'https', hostname: new URL(s3Url).hostname }] : []),
    ],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
