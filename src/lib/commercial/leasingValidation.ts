/** Shared by the short leasing form and its server action. No domain/provider blocklist. */
export function validOptionalWorkEmail(value: string): boolean {
  if (!value.trim()) return true;
  const email = value.trim();
  if (email.length > 254 || /\s/.test(email)) return false;
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return false;
  const labels = domain.split(".");
  return labels.length >= 2 && labels.every(label => /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(label));
}

export function validLeasingPhone(value: string): boolean {
  return /^[+\d\s().-]+$/.test(value.trim()) && /^\d{10,15}$/.test(value.replace(/\D/g, ""));
}

export type LeasingFieldErrors = Partial<Record<"name" | "phone" | "workEmail" | "requiredArea" | "locations", string>>;

export function validateLeasingEnquiry(input: {
  name: string; phone: string; workEmail: string; requiredArea: string; locations: string[];
}): LeasingFieldErrors {
  const errors: LeasingFieldErrors = {};
  if (!input.name.trim()) errors.name = "Enter your name.";
  if (!validLeasingPhone(input.phone)) errors.phone = "Enter a mobile number with 10–15 digits, including country code if needed.";
  if (!input.requiredArea.trim()) errors.requiredArea = "Choose the office area you need.";
  if (!input.locations.some(location => location.trim())) errors.locations = "Choose a preferred location, or Other / Flexible.";
  if (!validOptionalWorkEmail(input.workEmail)) errors.workEmail = "Enter a valid email address, or leave this optional field blank.";
  return errors;
}
