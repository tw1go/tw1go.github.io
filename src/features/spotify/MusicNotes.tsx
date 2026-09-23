import noteCluster from '../../assets/sprites/music/music-note.png'
import noteTrio from '../../assets/sprites/music/music-note-2-pixel.png'
import './music-notes.css'

/**
 * Notes drifting up off the jukebox while Spotify is playing.
 *
 * Each note carries its own sprite, start offset, drift, scale and delay
 * as custom properties, so one keyframe drives all of them. Staggering the
 * delays across a long cycle is what stops them reading as a row of things
 * moving in lockstep; alternating the two sprites stops the repeat from
 * being obvious once you've watched it for a few cycles.
 *
 * The sprites are solid black on transparent, which is invisible against
 * this room, so they are used as *masks* over a coloured box rather than
 * drawn directly. That also lets the colour follow the palette.
 */
const SPRITES = {
  cluster: { src: noteCluster, aspect: '431 / 489' },
  /* Pre-pixelated from music-note-2.png: that original is smooth vector
     curves, and no CSS property can make a curve blocky — `filter` has no
     pixelate function and `image-rendering` is ignored on a mask. So the
     artwork itself was resolved onto a 25x49 grid with a hard alpha
     threshold. Regenerate with scripts/pixelate-sprite.mjs. */
  trio: { src: noteTrio, aspect: '25 / 49' },
}

/* `drift` is a fraction of the sprite frame, not of the note: a percentage
   in `translate()` resolves against the element's own box, so on a 50px
   note it would amount to a pixel or two and read as straight up.

   The x values are centres, straddling the jukebox, whose cabinet runs
   from about 2% to 12% of the frame with its middle at 7%. Drift leans
   right, into the room, because the cabinet sits close enough to the
   left edge that a hard leftward drift would take notes off frame. */
const NOTES = [
  { id: 1, sprite: 'cluster', x: '6%', drift: -0.015, scale: 0.7, delay: '0s', duration: '7.5s' },
  { id: 2, sprite: 'trio', x: '8%', drift: 0.05, scale: 0.85, delay: '1.9s', duration: '8.5s' },
  { id: 3, sprite: 'trio', x: '7%', drift: 0.025, scale: 0.5, delay: '3.6s', duration: '9.5s' },
  { id: 4, sprite: 'cluster', x: '9%', drift: 0.07, scale: 0.75, delay: '5.2s', duration: '8s' },
] as const

export function MusicNotes() {
  return (
    <div className="music-notes" aria-hidden="true">
      {NOTES.map((note) => (
        <span
          key={note.id}
          className="music-notes__note"
          style={
            {
              '--note-src': `url(${SPRITES[note.sprite].src})`,
              '--note-aspect': SPRITES[note.sprite].aspect,
              '--n-x': note.x,
              '--n-drift': `${note.drift}`,
              '--n-scale': note.scale,
              animationDelay: note.delay,
              animationDuration: note.duration,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
