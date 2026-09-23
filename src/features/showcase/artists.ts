import { ARTIST_LINKS } from './artist-links'

/**
 * Every cover in assets/images, picked up by filename.
 *
 * Globbed rather than listed, so adding an artist is a matter of dropping
 * the image in and running `npm run artists` to resolve its link.
 */
const covers = import.meta.glob<string>('../../assets/images/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
})

export interface Artist {
  name: string
  cover: string
  url: string
}

export const ARTISTS: Artist[] = Object.entries(covers)
  .map(([path, cover]) => {
    const file = path.slice(path.lastIndexOf('/') + 1)
    const name = file.replace(/\.[^.]+$/, '')
    return {
      name,
      cover,
      // A search URL is a worse link than an artist page, but never a
      // dead one — so an unresolved name still goes somewhere useful.
      url: ARTIST_LINKS[name] ?? `https://open.spotify.com/search/${encodeURIComponent(name)}`,
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))
