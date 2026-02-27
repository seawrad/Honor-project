export interface Achievement {
  id: string
  code: string
  name: string
  nameZh: string
  description: string
  descriptionZh: string
  icon: string
  conditionType: string
  conditionValue: number | null
  sortOrder: number
  unlockedAt?: string
  isUnlocked: boolean
}

export interface UserAchievement {
  achievementId: string
  unlockedAt: string
  achievement: Achievement
}
