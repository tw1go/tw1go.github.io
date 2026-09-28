import { useEffect, useState } from 'react'
import { FORECAST_TTL_MS, currentWeather } from './forecast'

/**
 * What is outside the windows: the visitor's own time of day, and the
 * weather.
 *
 * The weather is the real forecast where the visitor is (see
 * forecast.ts). Until that arrives, or if it cannot be had, it is
 * simulated: drawn from the date and the three-hour block of the day, so
 * it holds for a few hours and changes as the day goes on, the way
 * weather does.
 */

export type Period = 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'night'
export type Weather = 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog'

export interface Sky {
  period: Period
  weather: Weather
}

export const PERIODS: Period[] = ['dawn', 'morning', 'afternoon', 'dusk', 'night']
export const WEATHERS: Weather[] = ['clear', 'cloudy', 'rain', 'storm', 'fog']

export function periodAt(date: Date): Period {
  const h = date.getHours() + date.getMinutes() / 60
  if (h >= 5 && h < 7) return 'dawn'
  if (h >= 7 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 19) return 'dusk'
  return 'night'
}

/* Odds out of 100, per period. Fog belongs to the early hours, storms to
   the afternoon heat — a little texture so the dice feel like weather. */
const ODDS: Record<Period, Record<Weather, number>> = {
  dawn: { clear: 40, cloudy: 22, rain: 13, storm: 5, fog: 20 },
  morning: { clear: 48, cloudy: 24, rain: 15, storm: 5, fog: 8 },
  afternoon: { clear: 42, cloudy: 26, rain: 16, storm: 14, fog: 2 },
  dusk: { clear: 44, cloudy: 26, rain: 16, storm: 9, fog: 5 },
  night: { clear: 50, cloudy: 22, rain: 16, storm: 7, fog: 5 },
}

/** A small, stable string hash, so the same block always rolls the same. */
function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % 100
}

export function weatherAt(date: Date, period: Period): Weather {
  const block = Math.floor(date.getHours() / 3)
  const roll = hash(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}#${block}`)
  let acc = 0
  for (const weather of WEATHERS) {
    acc += ODDS[period][weather]
    if (roll < acc) return weather
  }
  return 'clear'
}

/* How much light comes through an open window, 0 to 1. The product of
   the two: a rainy morning is dimmer than a clear one, and nothing
   brightens the room at night. */
const PERIOD_LIGHT: Record<Period, number> = {
  dawn: 0.5,
  morning: 1,
  afternoon: 1,
  dusk: 0.45,
  night: 0,
}

const WEATHER_LIGHT: Record<Weather, number> = {
  clear: 1,
  cloudy: 0.78,
  rain: 0.5,
  storm: 0.35,
  fog: 0.62,
}

export function daylight({ period, weather }: Sky): number {
  return PERIOD_LIGHT[period] * WEATHER_LIGHT[weather]
}

/**
 * The room's light level (0, 1 or 2) given how many curtains are open.
 * Full daylight lets each open window count; a dim sky only ever lifts
 * the room one step, however many are open; a dark one not at all.
 */
export function roomLight(openCurtains: number, sky: Sky): number {
  const light = daylight(sky)
  if (openCurtains === 0 || light < 0.3) return 0
  return light >= 0.75 ? openCurtains : Math.min(openCurtains, 1)
}

/* The colour of the shaft of light through an open window, and how
   strong it is. Warm white by day, gold at dawn, rose at dusk, a faint
   blue at night — the moon — and grey under cloud. */
export function rayFor(sky: Sky): { rgb: string; strength: number } {
  const base: Record<Period, string> = {
    dawn: '255 196 140',
    morning: '255 250 232',
    afternoon: '255 246 222',
    dusk: '255 164 150',
    night: '170 196 255',
  }
  const grey = sky.weather === 'rain' || sky.weather === 'storm' || sky.weather === 'fog'
  return {
    rgb: grey ? '214 222 232' : base[sky.period],
    strength: sky.period === 'night' ? 0.35 : Math.max(0.25, daylight(sky)),
  }
}

export const SKY_EVENT = 'sky:override'

/** Sent with each override: what to change, or null to go back to live. */
type OverrideDetail = Partial<Sky> | null

function send(detail: OverrideDetail) {
  window.dispatchEvent(new CustomEvent<OverrideDetail>(SKY_EVENT, { detail }))
}

/**
 * Sets the time of day outside the windows, overriding the clock.
 * Takes a period — 'dawn', 'morning', 'afternoon', 'dusk', 'night' — or
 * an hour from 0 to 23, which is turned into its period.
 */
export function setTime(time: Period | number): void {
  const period =
    typeof time === 'number' ? periodAt(new Date(2000, 0, 1, Math.floor(time), (time % 1) * 60)) : time
  if (!PERIODS.includes(period)) {
    console.warn(`setTime: expected an hour or one of ${PERIODS.join(', ')}`)
    return
  }
  send({ period })
}

/** Sets the weather, overriding the forecast: 'clear', 'cloudy',
    'rain', 'storm' or 'fog'. */
export function setWeather(weather: Weather): void {
  if (!WEATHERS.includes(weather)) {
    console.warn(`setWeather: expected one of ${WEATHERS.join(', ')}`)
    return
  }
  send({ weather })
}

/** Both at once: `setSky({ period: 'night', weather: 'storm' })`. */
export function setSky(sky: Partial<Sky>): void {
  if (sky.period) setTime(sky.period)
  if (sky.weather) setWeather(sky.weather)
}

/** Back to the visitor's real clock and the live forecast. */
export function resetSky(): void {
  send(null)
}

declare global {
  interface Window {
    setTime?: typeof setTime
    setWeather?: typeof setWeather
    setSky?: typeof setSky
    resetSky?: typeof resetSky
  }
}

/* On window for the console. Overrides combine — setTime then setWeather
   keeps both — until resetSky(). */
if (typeof window !== 'undefined') {
  Object.assign(window, { setTime, setWeather, setSky, resetSky })
}

function live(): Sky {
  const now = new Date()
  const period = periodAt(now)
  return { period, weather: weatherAt(now, period) }
}

/** The sky right now: the clock rechecked every minute, the forecast
    every twenty. */
export function useSky(): Sky {
  const [real, setReal] = useState(live)
  const [forecast, setForecast] = useState<Weather | null>(null)
  const [override, setOverride] = useState<Partial<Sky> | undefined>()

  useEffect(() => {
    let cancelled = false
    const check = () =>
      void currentWeather().then((weather) => {
        if (!cancelled && weather) setForecast(weather)
      })
    check()
    const timer = window.setInterval(check, FORECAST_TTL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setReal((prev) => {
        const next = live()
        return next.period === prev.period && next.weather === prev.weather ? prev : next
      })
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const onOverride = (event: Event) => {
      const detail = (event as CustomEvent<OverrideDetail>).detail
      setOverride((prev) => (detail ? { ...prev, ...detail } : undefined))
    }
    window.addEventListener(SKY_EVENT, onOverride)
    return () => window.removeEventListener(SKY_EVENT, onOverride)
  }, [])

  return {
    period: override?.period ?? real.period,
    weather: override?.weather ?? forecast ?? real.weather,
  }
}
