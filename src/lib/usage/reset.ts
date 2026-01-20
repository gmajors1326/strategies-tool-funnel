import { addDays, startOfDay } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const TIME_ZONE = 'America/Chicago'

export const getNextResetAt = (now: Date) => {
  const chicagoNow = toZonedTime(now, TIME_ZONE)
  const nextResetLocal = addDays(startOfDay(chicagoNow), 1)
  return fromZonedTime(nextResetLocal, TIME_ZONE)
}

export const getWindowStart = (now: Date) => {
  const chicagoNow = toZonedTime(now, TIME_ZONE)
  const startLocal = startOfDay(chicagoNow)
  return fromZonedTime(startLocal, TIME_ZONE)
}
