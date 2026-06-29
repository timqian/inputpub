import type { ImageHost } from './types'
import { CloudIcon } from '../destinations/icons'
import { req, uploadToS3 } from './shared'

/** Cloudflare R2 via its S3-compatible API. Region is always "auto"; the
 *  endpoint is derived from the account id. R2 objects aren't public by
 *  default, so a Public URL base (r2.dev or a custom domain) is recommended. */
export const r2Host: ImageHost = {
  id: 'r2',
  name: 'Cloudflare R2',
  icon: CloudIcon,
  config: [
    {
      key: 'accountId',
      label: 'Account ID',
      placeholder: 'a1b2c3…',
      hint: 'From the R2 endpoint https://<account-id>.r2.cloudflarestorage.com',
    },
    {
      key: 'accessKeyId',
      label: 'Access Key ID',
      hint: (
        <>
          Create an R2 API token to get an S3 Access Key ID + Secret.{' '}
          <a
            href="https://dash.cloudflare.com/?to=/:account/r2/api-tokens"
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Get keys ↗
          </a>
        </>
      ),
    },
    { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password' },
    {
      key: 'bucket',
      label: 'Bucket',
      placeholder: 'images',
      hint: (
        <>
          The bucket must allow CORS <b>PUT</b> from this site so the browser can upload.{' '}
          <a
            href="https://developers.cloudflare.com/r2/buckets/cors/"
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            How to set CORS ↗
          </a>
        </>
      ),
    },
    { key: 'prefix', label: 'Key prefix (optional)', placeholder: 'images', optional: true },
    {
      key: 'baseUrl',
      label: 'Public URL base',
      placeholder: 'https://pub-….r2.dev or your custom domain',
      optional: true,
      hint: (
        <>
          R2 objects are private by default — enable the r2.dev URL or a custom domain so embedded
          images load.{' '}
          <a
            href="https://developers.cloudflare.com/r2/buckets/public-buckets/"
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            How to make public ↗
          </a>
        </>
      ),
    },
  ],
  async upload(file, ctx) {
    const accountId = req(ctx, 'accountId', 'account id')
    return uploadToS3(
      {
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        region: 'auto',
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
