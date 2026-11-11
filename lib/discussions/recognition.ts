export type RecognitionState = {
  active: boolean;
  reason: string | null;
  canAward: boolean;
  canRevoke: boolean;
  recognitionId: string | null;
};
