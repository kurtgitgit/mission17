export type MainTabName =
  | 'HomeTab'
  | 'AnnouncementsTab'
  | 'AssistantTab'
  | 'CaptainControlTab'
  | 'LearnTab'
  | 'ProfileTab';

export function getMainTabOrder(role: string | null | undefined): MainTabName[] {
  const roleTab: MainTabName = role === 'super_admin' ? 'CaptainControlTab' : 'LearnTab';

  return ['HomeTab', 'AnnouncementsTab', 'AssistantTab', roleTab, 'ProfileTab'];
}
