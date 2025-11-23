/**
 * Web Worker for image decoding
 * Uses createImageBitmap for efficient image processing
 */

export interface ImageDecodeMessage {
  type: 'decode'
  file: File
  id: string
}

export interface ImageDecodeResponse {
  type: 'decode-success' | 'decode-error'
  id: string
  imageBitmap?: ImageBitmap
  error?: string
  width?: number
  height?: number
}

self.onmessage = async (event: MessageEvent<ImageDecodeMessage>) => {
  const { type, file, id } = event.data

  if (type === 'decode') {
    try {
      const imageBitmap = await createImageBitmap(file)
      const response: ImageDecodeResponse = {
        type: 'decode-success',
        id,
        imageBitmap,
        width: imageBitmap.width,
        height: imageBitmap.height,
      }
      self.postMessage(response, [imageBitmap])
    } catch (error) {
      const response: ImageDecodeResponse = {
        type: 'decode-error',
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
      self.postMessage(response)
    }
  }
}

