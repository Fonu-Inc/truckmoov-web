import { queryOptions, useMutation } from '@tanstack/react-query'

import { queryClient } from '../lib/query-client'
import {
  deleteInvitedUser,
  getActivityLog,
  getInvitedUsers,
  updateInvitedUser,
} from './requests'
import type { ActivityLogQuery } from './types'

export type { ActivityLogEntry, ActivityLogQuery, DeleteUserPayload, InvitedUser, UpdateInvitedUserPayload } from './types'

export const AUTH_QUERY_KEY = {
  user: ['user'],
  invitedUsers: ['invitedUsers'],
  activityLog: (payload?: ActivityLogQuery) => ['activityLog', payload],
} as const

export function getInvitedUsersQueryOptions() {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.invitedUsers,
    queryFn: getInvitedUsers,
  })
}

export function getActivityLogQueryOptions(payload?: ActivityLogQuery) {
  return queryOptions({
    queryKey: AUTH_QUERY_KEY.activityLog(payload),
    queryFn: () => getActivityLog(payload),
  })
}

export function useUpdateInvitedUser() {
  return useMutation({
    mutationFn: updateInvitedUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.invitedUsers })
    },
  })
}

export function useDeleteInvitedUser() {
  return useMutation({
    mutationFn: deleteInvitedUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY.invitedUsers })
    },
  })
}
