export function modSubmitAction(event: Event): string | undefined {
  const submitter = (event as SubmitEvent).submitter;
  return submitter instanceof HTMLButtonElement ? submitter.value : undefined;
}

export function uploadPublicationStatus(action: string | undefined) {
  return action === "publish" ? "published" : "draft";
}

export function editPublicationStatus(status: string, action: string | undefined): string {
  if (status === "draft" && action === "publish") return "published";
  if ((status === "draft" || status === "published") && action === "archive") return "archived";
  return status;
}
