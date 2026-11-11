type Metadata = Record<string, unknown> | null | undefined;
type Names = { recipientName?: string | null; teamName?: string | null; leaderName?: string | null };

export function isTeamInvitationBroadcast(metadata: Metadata): boolean {
  return metadata?.notificationAudience === "team";
}

export function teamInvitationTitle(metadata: Metadata, accountId: string | null, pending: boolean): string {
  if (isTeamInvitationBroadcast(metadata)) return pending ? "Pending team invitation" : "Creator invited to team";
  if (metadata?.recipientProfileId === accountId) return "Team invitation";
  if (metadata?.senderProfileId === accountId) return pending ? "Pending team invitation" : "Team invitation sent";
  return pending ? "Pending team invitation" : "Creator invited to team";
}

export function teamInvitationSummary(metadata: Metadata, accountId: string | null, pending: boolean, names: Names = {}): string {
  const recipient = names.recipientName || (typeof metadata?.recipientCreatorName === "string" ? metadata.recipientCreatorName : "A creator");
  const team = names.teamName || (typeof metadata?.teamName === "string" ? metadata.teamName : "the team");
  if (!isTeamInvitationBroadcast(metadata) && metadata?.recipientProfileId === accountId) {
    return `You've been invited to join ${team}${names.leaderName ? `, led by ${names.leaderName}` : ""}.`;
  }
  const text = !isTeamInvitationBroadcast(metadata) && metadata?.senderProfileId === accountId
    ? `You invited ${recipient} to join ${team}.`
    : `${recipient} was invited to join ${team}.`;
  return text + (pending ? " Waiting for their response." : "");
}
