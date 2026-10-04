export function getGta5ModsVerificationInstructions(): string {
  return (
    "Add your verification code to a public comment of your GTA5-Mods, to be displayed on your profile."
  );
}

export function createGta5modsVerificationCode(): string {

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "MV-";

  for (let i = 0; i < 8; i++) {

    code +=
      chars[
        Math.floor(
          Math.random() * chars.length
        )
      ];

    if (i === 3) {
      code += "-";
    }

  }

  return code;
}

export type VerificationChallenge = {
  code: string;
  createdAt: string;
  status: "pending" | "verified" | "expired";
};

export function createVerificationChallenge(): VerificationChallenge {
  return {
    code: createGta5modsVerificationCode(),
    createdAt: new Date().toISOString(),
    status: "pending",
  };
}