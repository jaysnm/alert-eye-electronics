import { withPayload } from '@payloadcms/next/withPayload'

const s3Url = process.env.NEXT_PUBLIC_S3_PUBLIC_URL
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  images: {
    // Local dev serves media from the Payload API on localhost (a private IP);
    // in production, media is served from object storage (S3/R2) when
    // NEXT_PUBLIC_S3_PUBLIC_URL is set, otherwise it's proxied through the
    // Payload API on the app's own domain (NEXT_PUBLIC_SERVER_URL), since
    // Payload returns an absolute url for upload fields.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
      ...(s3Url ? [{ protocol: 'https', hostname: new URL(s3Url).hostname }] : []),
      ...(serverUrl ? [{ protocol: new URL(serverUrl).protocol.replace(':', ''), hostname: new URL(serverUrl).hostname }] : []),
    ],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
