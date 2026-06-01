import { axiosInstance } from '../lib/axios-instance'

import type {
  ActivityLogQuery,
  ActivityLogEntry,
  DeleteUserPayload,
  InvitedUser,
  UpdateInvitedUserPayload,
} from './types'

export async function getActivityLog(payload?: ActivityLogQuery): Promise<ActivityLogEntry[]> {
  const { data } = await axiosInstance.get('/auth/activity-log', {
    params: payload?.params,
  })
  return data
}

export async function getInvitedUsers(): Promise<InvitedUser[]> {
  const { data } = await axiosInstance.get('/auth/invited-users')
  return data
}

export async function updateInvitedUser({ id, data: body }: UpdateInvitedUserPayload): Promise<InvitedUser> {
  const { data } = await axiosInstance.patch(`/auth/invited-users/${id}`, body)
  return data
}

export async function deleteInvitedUser({ id }: DeleteUserPayload): Promise<void> {
  await axiosInstance.delete(`/auth/invited-users/${id}`)
}
