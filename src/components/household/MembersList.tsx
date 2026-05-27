import React from 'react'
import { format } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { RemoveMemberButton } from './RemoveMemberButton'
import { RevokeInviteButton } from './RevokeInviteButton'
import { RoleSelector } from './RoleSelector'

export interface HouseholdMember {
  id: string
  userId: string
  displayName: string | null
  avatarUrl: string | null
  role: string
  joinedAt: Date | string | null
}

export interface PendingInvite {
  id: string
  email: string | null
  expiresAt: Date | string
}

interface MembersListProps {
  members: HouseholdMember[]
  currentUserId: string
  isAdmin: boolean
  pendingInvites?: PendingInvite[]
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'admin': return 'Admin'
    case 'contributor': return 'Contributor'
    case 'view-only': return 'View-only'
    default: return 'Member'
  }
}

export function MembersList({ members, currentUserId, isAdmin, pendingInvites = [] }: MembersListProps) {
  return (
    <div className="space-y-2">
      {members.map((member) => {
        const initials = getInitials(member.displayName)
        const joinedDate = member.joinedAt
          ? format(new Date(member.joinedAt), 'MMM yyyy')
          : null
        const isSelf = member.userId === currentUserId
        const isOwnerAdmin = member.role === 'admin'

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
                    <span className="ml-1 text-xs text-kinship-on-surface-variant">(you)</span>
                  )}
                </span>
                {joinedDate && (
                  <span className="font-body text-xs text-kinship-on-surface-variant">
                    Joined {joinedDate}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && !isSelf ? (
                <RoleSelector memberId={member.id} currentRole={member.role} />
              ) : (
                <Badge variant={isOwnerAdmin ? 'default' : 'secondary'}>
                  {getRoleLabel(member.role)}
                </Badge>
              )}

              {isAdmin && !(isSelf && isOwnerAdmin) && (
                <RemoveMemberButton memberId={member.id} memberName={member.displayName} />
              )}
            </div>
          </div>
        )
      })}

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <>
          {pendingInvites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between rounded-lg border border-dashed border-border bg-kinship-surface-container-lowest px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Avatar size="default">
                  <AvatarFallback className="bg-kinship-surface-container text-kinship-on-surface-variant">
                    ?
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <span className="font-body text-sm font-medium text-kinship-on-surface-variant">
                    {invite.email ?? 'Invite link'}
                  </span>
                  <span className="font-body text-xs text-kinship-on-surface-variant">
                    Expires {format(new Date(invite.expiresAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                  Pending
                </Badge>
                {isAdmin && (
                  <RevokeInviteButton inviteId={invite.id} inviteEmail={invite.email} />
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {members.length === 0 && pendingInvites.length === 0 && (
        <p className="font-body text-sm text-kinship-on-surface-variant py-4 text-center">
          No members found.
        </p>
      )}
    </div>
  )
}
