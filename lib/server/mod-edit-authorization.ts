export function isAuthorizedModEditor(input: {
  userId: string | null | undefined;
  modCreatorId: string | null | undefined;
  linkedCreatorId: string | null | undefined;
  creatorOwnerId: string | null | undefined;
}): boolean {
  const { userId, modCreatorId, linkedCreatorId, creatorOwnerId } = input;
  return Boolean(
    userId &&
      modCreatorId &&
      linkedCreatorId &&
      creatorOwnerId &&
      modCreatorId === linkedCreatorId &&
      creatorOwnerId === userId
  );
}
