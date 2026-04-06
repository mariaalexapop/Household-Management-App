import React from 'react'
import { format } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { RemoveMemberButton } from './RemoveMemberButton'

export interface HouseholdMember {
  id: string
  userId: string
  displayName: string | null
  avatarUrl: string | null
  role: string
  joinedAt: Date | string | null
}

interface MembersListProps {
  members: HouseholdMember[]
  currentUserId: string
  isAdmin: boolean
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

/**
 * MembersList — Server Component
 *
 * Renders all household members with avatar, display name, role badge,
 * and joined date. Admins see a "Remove" button on each member row
 * (except their own row).
 */
export function MembersList({ members, currentUserId, isAdmin }: MembersListProps) {
  return (
    <div className="space-y-2">
      {members.map((member) => {
        const initials = getInitials(member.displayName)
        const joinedDate = member.joinedAt
          ? format(new Date(member.joinedAt), 'MMM yyyy')
          : null
        const isSelf = member.userId === currentUserId

        return (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <Avatar size="default">
                {member.avatarUrl && (
                  <AvatarImage src={member.avatarUrl} alt={member.displayName ?? 'Member'} />
                )}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="flex flex-col">
                <span className="font-body text-sm font-medium text-foreground">
                  {member.displayName ?? member.userId}
                  {isSelf && (
                    <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                  )}
                </span>
                {joinedDate && (
                  <span className="font-body text-xs text-muted-foreground">
                    Joined {joinedDate}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                {member.role === 'admin' ? 'Admin' : 'Member'}
              </Badge>

              {isAdmin && !(isSelf && member.role === 'admin') && (
                <RemoveMemberButton memberId={member.id} memberName={member.displayName} />
              )}
            </div>
          </div>
        )
      })}

      {members.length === 0 && (
        <p className="font-body text-sm text-muted-foreground py-4 text-center">
          No members found.
        </p>
      )}
    </div>
  )
}
