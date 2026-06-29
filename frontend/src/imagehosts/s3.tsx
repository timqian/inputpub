import type { ImageHost } from './types'
import { BucketIcon } from '../destinations/icons'
import { req, uploadToS3 } from './shared'

/** AWS S3. Virtual-hosted style (bucket in the host). The bucket must allow
 *  CORS PUT from this origin, and be publicly readable (or set a Public URL
 *  base / CDN domain) for the embedded links to load. */
export const s3Host: ImageHost = {
  id: 's3',
  name: 'AWS S3',
  icon: BucketIcon,
  config: [
    {
      key: 'accessKeyId',
      label: 'Access Key ID',
      placeholder: 'AKIA…',
      hint: (
        <>
          An IAM user access key with S3 write access.{' '}
          <a
            href="https://console.aws.amazon.com/iam/home#/users"
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Create one ↗
          </a>
        </>
      ),
    },
    { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password' },
    { key: 'region', label: 'Region', placeholder: 'us-east-1' },
    { key: 'bucket', label: 'Bucket', placeholder: 'my-bucket' },
    { key: 'prefix', label: 'Key prefix (optional)', placeholder: 'images', optional: true },
    {
      key: 'baseUrl',
      label: 'Public URL base (optional)',
      placeholder: 'https://cdn.example.com',
      optional: true,
      hint: 'Used to build the embedded link. Defaults to the S3 object URL (the bucket must be publicly readable).',
    },
  ],
  async upload(file, ctx) {
    const region = req(ctx, 'region', 'region')
    return uploadToS3(
      {
        endpoint: `https://s3.${region}.amazonaws.com`,
        region,
        bucket: req(ctx, 'bucket', 'bucket'),
        accessKeyId: req(ctx, 'accessKeyId', 'access key id'),
        secretAccessKey: req(ctx, 'secretAccessKey', 'secret access key'),
      },
      file,
      ctx.getConfig('prefix'),
      ctx.getConfig('baseUrl'),
    )
  },
}
