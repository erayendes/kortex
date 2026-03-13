import { nanoid } from "nanoid";

export function generateId(prefix = "KTX"): string {
  return `${prefix}-${nanoid(8)}`;
}

export function generateShortId(): string {
  return nanoid(12);
}
