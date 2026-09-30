import { useCallback, useEffect, useRef, useState } from 'react'
import { BOT_API_ENABLED, PREVIEW_FIND_EVENT, rollFind, type Find } from './api'

/**
 * The chance of a Kowen on every character click.
 *
 * Returns the find being shown (if any), a function to call from each
 * character's click handler, and one to close the panel. Only one find is
 * shown at a time, and no roll is sent while one is up.
 */
export function useKowenFinds() {
  const [find, setFind] = useState<Find | null>(null)
  const showing = useRef(false)

  // Whether Fairy Cha is in the room right now — set by the room, read at
  // the moment of each click. A ref, since it changes mid-flight and no
  // render depends on it.
  const fairyAround = useRef(false)
  const setFairyAround = useCallback((around: boolean) => {
    fairyAround.current = around
  }, [])

  useEffect(() => {
    const onPreview = (event: Event) => {
      const character = (event as CustomEvent<string>).detail
      showing.current = true
      setFind({ code: 'PREVIEW', expires: Date.now() + 15 * 60_000, reward: 1, character, preview: true })
    }
    window.addEventListener(PREVIEW_FIND_EVENT, onPreview)
    return () => window.removeEventListener(PREVIEW_FIND_EVENT, onPreview)
  }, [])

  const tryFind = useCallback((character: string) => {
    if (!BOT_API_ENABLED || showing.current) return
    void rollFind(character, fairyAround.current).then((result) => {
      if (!result || showing.current) return
      showing.current = true
      setFind(result)
    })
  }, [])

  const close = useCallback(() => {
    showing.current = false
    setFind(null)
  }, [])

  return { find, tryFind, close, setFairyAround }
}
