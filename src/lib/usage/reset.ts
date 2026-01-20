import { addDays, startOfDay } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

const TIME_ZONE = 'America/Chicago'

export const getNextResetAt = (now: Date) => {
  const chicagoNow = utcToZonedTime(now, TIME_ZONE)
  const nextResetLocal = addDays(startOfDay(chicagoNow), 1)
  return zonedTimeToUtc(nextResetLocal, TIME_ZONE)
}

export const getWindowStart = (now: Date) => {
  const chicagoNow = utcToZonedTime(now, TIME_ZONE)
  const startLocal = startOfDay(chicagoNow)
  return zonedTimeToUtc(startLocal, TIME_ZONE)
}
