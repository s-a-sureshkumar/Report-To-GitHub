import { uploadData } from 'aws-amplify/storage'

/** Uploads screenshots under the signed-in user's identity prefix; returns the S3 keys. */
export async function uploadScreenshots(files: File[]): Promise<string[]> {
  const keys: string[] = []
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const result = await uploadData({
      path: ({ identityId }) => `screenshots/${identityId}/${crypto.randomUUID()}-${safeName}`,
      data: file,
      options: { contentType: file.type || 'application/octet-stream' },
    }).result
    keys.push(result.path)
  }
  return keys
}
