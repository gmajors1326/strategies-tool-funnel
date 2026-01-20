import { prisma } from './db'

export type NotificationType = 'tool_failed' | 'usage_limit' | 'export_ready'

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  metadata?: Record<string, any>
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata ?? undefined,
    },
  })
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function markNotificationsRead(userId: string, ids: string[]) {
  return prisma.notification.updateMany({
    where: { userId, id: { in: ids } },
    data: { readAt: new Date() },
  })
}

export async function getNotificationPreference(userId: string) {
  return prisma.notificationPreference.findUnique({
    where: { userId },
  })
}

export async function upsertNotificationPreference(userId: string, digestFrequency: string) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: { digestFrequency },
    create: { userId, digestFrequency },
  })
}
