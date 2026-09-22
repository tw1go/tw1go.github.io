import { useEffect, useRef } from 'react'

interface PixelArtProps {
  src: string
  alt: string
  /** Edge of the low-res buffer, in art pixels. */
  resolution: number
}

/**
 * Album art, genuinely pixelated.
 *
 * `image-rendering: pixelated` on its own does nothing here — it only
 * shows chunky pixels while *upscaling*, and Spotify's art arrives at its
 * native size. So the image is first drawn down into a small canvas, and
 * that canvas is what gets scaled back up by CSS.
 *
 * Drawing a cross-origin image taints the canvas, which only blocks
 * reading pixels back out (`getImageData`). Displaying it is unaffected,
 * so no CORS cooperation is needed from Spotify's CDN.
 */
export function PixelArt({ src, alt, resolution }: PixelArtProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !src) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const image = new Image()
    let cancelled = false

    image.onload = () => {
      if (cancelled) return
      ctx.clearRect(0, 0, resolution, resolution)
      // Smoothing stays ON for the downsample: averaging each block keeps
      // the cover readable, where point-sampling would pick one arbitrary
      // pixel per block and throw the rest away. The blocky look comes
      // from the upscale, which CSS does with nearest-neighbour.
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(image, 0, 0, resolution, resolution)
    }

    image.src = src
    return () => {
      cancelled = true
    }
  }, [src, resolution])

  return (
    <canvas
      ref={ref}
      className="now-playing__art"
      width={resolution}
      height={resolution}
      role="img"
      aria-label={alt}
    />
  )
}
