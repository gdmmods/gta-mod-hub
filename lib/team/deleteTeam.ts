/** @deprecated Teams preserve their identities. Use /api/team-lifecycle. */
export async function deleteTeam(_params: { creatorId: string; teamId: string }): Promise<never> {
  void _params;
  throw new Error('Permanent team deletion is disabled. Use Archive Team.');
}
