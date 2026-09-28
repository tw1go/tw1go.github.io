/* A quaver, one character per art pixel, as the other pixel marks are.
   Built into an SVG of unit squares so it scales up with hard edges. */
const NOTE = ['..xx.', '..x.x', '..x..', '..x..', 'xxx..', 'xxx..', '.x...']

export const NOTE_SRC = (() => {
  const cells = NOTE.flatMap((row, y) =>
    [...row].flatMap((c, x) => (c === 'x' ? [`<rect x="${x}" y="${y}" width="1" height="1" fill="#e0f2fe"/>`] : [])),
  ).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 7" shape-rendering="crispEdges">${cells}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
})()
