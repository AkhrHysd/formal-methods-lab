export function isUsageDenied(balance: number, usage: number): boolean {
  return !(balance >= usage);
}

export function isUsageDeniedDirect(balance: number, usage: number): boolean {
  return balance < usage;
}
