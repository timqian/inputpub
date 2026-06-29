// Minimal AWS Signature V4 PutObject for S3-compatible storage (AWS S3,
// Cloudflare R2, MinIO, …). Runs entirely in the browser: the user brings their
// own access key / secret (stored locally), so the target bucket must allow
// cross-origin PUT requests (CORS) from this site's origin.

function hex(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += b.toString(16).padStart(2, '0')
  return s
}

/** Encode a string to an ArrayBuffer-backed byte array (Web Crypto rejects the
 *  default ArrayBufferLike-typed arrays under strict typed-array types). */
const u8 = (s: string): Uint8Array<ArrayBuffer> => new Uint8Array(new TextEncoder().encode(s))

async function sha256Hex(data: Uint8Array<ArrayBuffer>): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', data)))
}

async function hmac(key: Uint8Array<ArrayBuffer>, msg: string): Promise<Uint8Array<ArrayBuffer>> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, u8(msg)))
}

/** URI-encode each path segment but keep the slashes between them. */
function encodeKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/')
}

export interface S3Target {
  /** Service origin, e.g. https://s3.us-east-1.amazonaws.com or
   *  https://<account>.r2.cloudflarestorage.com */
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  /** Put the bucket in the path instead of the host. Needed for R2 and most
   *  S3-compatible services; AWS S3 uses virtual-hosted style. */
  forcePathStyle?: boolean
}

/** Upload one object and return the URL it was written to. */
export async function s3PutObject(
  t: S3Target,
  key: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const url = new URL(t.endpoint)
  const host = t.forcePathStyle ? url.host : `${t.bucket}.${url.host}`
  const canonicalUri = t.forcePathStyle ? `/${t.bucket}/${encodeKey(key)}` : `/${encodeKey(key)}`
  const objectUrl = `${url.protocol}//${host}${canonicalUri}`

  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '') // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8)
  const payloadHash = await sha256Hex(new Uint8Array(body))

  const canonicalHeaders =
    `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const scope = `${dateStamp}/${t.region}/s3/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    await sha256Hex(u8(canonicalRequest)),
  ].join('\n')

  const kDate = await hmac(u8('AWS4' + t.secretAccessKey), dateStamp)
  const kRegion = await hmac(kDate, t.region)
  const kService = await hmac(kRegion, 's3')
  const kSigning = await hmac(kService, 'aws4_request')
  const signature = hex(await hmac(kSigning, stringToSign))

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${t.accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`

  const res = await fetch(objectUrl, {
    method: 'PUT',
    headers: {
      Authorization: authorization,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'Content-Type': contentType,
    },
    body,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Upload failed (${res.status})${detail ? `: ${detail.slice(0, 160)}` : ''}`)
  }
  return objectUrl
}
