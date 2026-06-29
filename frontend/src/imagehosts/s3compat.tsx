import type { ImageHost } from './types'
import { StackIcon } from '../destinations/icons'
import { req, uploadToS3 } from './shared'

/** Any S3-compatible API (MinIO, Backblaze B2, DigitalOcean Spaces, …). The
 *  user supplies the full endpoint. Path-style addressing is used, which these
 *  services accept. */
export const s3compatHost: ImageHost = {
  id: 's3compat',
  name: 'S3-compatible',
  icon: StackIcon,
  config: [
    {
      key: 'endpoint',
      label: 'Endpoint',
      placeholder: 'https://s3.us-west-1.example.com',
      hint: 'The service’s S3 API endpoint (without the bucket).',
    },
    { key: 'region', label: 'Region', placeholder: 'us-east-1' },
    { key: 'accessKeyId', label: 'Access Key ID' },
    { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password' },
    { key: 'bucket', label: 'Bucket', placeholder: 'images' },
    { key: 'prefix', label: 'Key prefix (optional)', placeholder: 'images', optional: true },
    {
      key: 'baseUrl',
      label: 'Public URL base (optional)',
      placeholder: 'https://cdn.example.com',
      optional: true,
      hint: 'Used to build the embedded link. Defaults to the object URL.',
    },
  ],
  async upload(file, ctx) {
    return uploadToS3(
      {
        endpoint: req(ctx, 'endpoint', 'endpoint'),
        region: ctx.getConfig('region')?.trim() || 'us-east-1',
        bucket: req(ctx, 'bucket', 'bucket'),
        accessKeyId: req(ctx, 'accessKeyId', 'access key id'),
        secretAccessKey: req(ctx, 'secretAccessKey', 'secret access key'),
        forcePathStyle: true,
      },
      file,
      ctx.getConfig('prefix'),
      ctx.getConfig('baseUrl'),
    )
  },
}
