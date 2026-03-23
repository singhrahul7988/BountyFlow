import type { NextRequest } from "next/server";

import {
  buildInvalidJsonResponse,
  buildUnexpectedFieldsResponse,
  buildValidationErrorResponse
} from "./api-errors";

type ValidationSuccess<T> = {
  ok: true;
  value: T;
};

type ValidationFailure = {
  ok: false;
  response: ReturnType<typeof buildValidationErrorResponse>;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

type StringOptions = {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  lowercase?: boolean;
  allowEmpty?: boolean;
};

type NumberOptions = {
  min?: number;
  max?: number;
  integer?: boolean;
};

function ok<T>(value: T): ValidationSuccess<T> {
  return { ok: true, value };
}

function fail(message: string): ValidationFailure {
  return { ok: false, response: buildValidationErrorResponse(message) };
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function parseJsonObjectBody(
  request: Request | NextRequest,
  allowedKeys: readonly string[]
): Promise<ValidationResult<Record<string, unknown>>> {
  const body = (await request.json().catch(() => null)) as unknown;

  if (!isPlainObject(body)) {
    return { ok: false, response: buildInvalidJsonResponse() };
  }

  const unknownKeys = Object.keys(body).filter((key) => !allowedKeys.includes(key));

  if (unknownKeys.length) {
    return { ok: false, response: buildUnexpectedFieldsResponse() };
  }

  return ok(body);
}

function normalizeStringValue(value: string, lowercase: boolean) {
  const strippedControlChars = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return lowercase ? strippedControlChars.toLowerCase() : strippedControlChars;
}

export function readRequiredString(
  source: Record<string, unknown>,
  key: string,
  options: StringOptions = {}
): ValidationResult<string> {
  const raw = source[key];

  if (typeof raw !== "string") {
    return fail(`${key} is required.`);
  }

  const value = normalizeStringValue(raw, Boolean(options.lowercase));

  if (!options.allowEmpty && !value) {
    return fail(`${key} is required.`);
  }

  if (options.minLength && value.length < options.minLength) {
    return fail(`${key} is too short.`);
  }

  if (options.maxLength && value.length > options.maxLength) {
    return fail(`${key} is too long.`);
  }

  if (options.pattern && !options.pattern.test(value)) {
    return fail(`${key} is invalid.`);
  }

  return ok(value);
}

export function readOptionalString(
  source: Record<string, unknown>,
  key: string,
  options: StringOptions = {}
): ValidationResult<string | undefined> {
  const raw = source[key];

  if (raw === undefined || raw === null || raw === "") {
    return ok(undefined);
  }

  if (typeof raw !== "string") {
    return fail(`${key} is invalid.`);
  }

  return readRequiredString({ [key]: raw }, key, { ...options, allowEmpty: options.allowEmpty ?? false });
}

export function readBoolean(
  source: Record<string, unknown>,
  key: string
): ValidationResult<boolean> {
  const raw = source[key];

  if (typeof raw !== "boolean") {
    return fail(`${key} must be true or false.`);
  }

  return ok(raw);
}

export function readRequiredNumber(
  source: Record<string, unknown>,
  key: string,
  options: NumberOptions = {}
): ValidationResult<number> {
  const raw = source[key];

  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return fail(`${key} must be a valid number.`);
  }

  if (options.integer && !Number.isInteger(raw)) {
    return fail(`${key} must be a whole number.`);
  }

  if (options.min !== undefined && raw < options.min) {
    return fail(`${key} is too small.`);
  }

  if (options.max !== undefined && raw > options.max) {
    return fail(`${key} is too large.`);
  }

  return ok(raw);
}

export function readOptionalNumber(
  source: Record<string, unknown>,
  key: string,
  options: NumberOptions = {}
): ValidationResult<number | undefined> {
  const raw = source[key];

  if (raw === undefined || raw === null) {
    return ok(undefined);
  }

  return readRequiredNumber(source, key, options);
}

export function readEnum<T extends string>(
  source: Record<string, unknown>,
  key: string,
  allowedValues: readonly T[]
): ValidationResult<T> {
  const raw = source[key];

  if (typeof raw !== "string" || !allowedValues.includes(raw as T)) {
    return fail(`${key} is invalid.`);
  }

  return ok(raw as T);
}

export function readStringArray(
  source: Record<string, unknown>,
  key: string,
  options: {
    maxItems: number;
    maxLength: number;
    minItems?: number;
    allowEmpty?: boolean;
  }
): ValidationResult<string[]> {
  const raw = source[key];

  if (!Array.isArray(raw)) {
    return fail(`${key} must be an array.`);
  }

  if (options.minItems !== undefined && raw.length < options.minItems) {
    return fail(`${key} must include more items.`);
  }

  if (raw.length > options.maxItems) {
    return fail(`${key} has too many items.`);
  }

  const values: string[] = [];

  for (const entry of raw) {
    if (typeof entry !== "string") {
      return fail(`${key} contains an invalid item.`);
    }

    const normalized = normalizeStringValue(entry, false);

    if (!options.allowEmpty && !normalized) {
      return fail(`${key} contains an empty item.`);
    }

    if (normalized.length > options.maxLength) {
      return fail(`${key} contains an item that is too long.`);
    }

    values.push(normalized);
  }

  return ok(values);
}

export function readEnumArray<T extends string>(
  source: Record<string, unknown>,
  key: string,
  allowedValues: readonly T[],
  options: {
    maxItems: number;
    minItems?: number;
  }
): ValidationResult<T[]> {
  const values = readStringArray(source, key, {
    maxItems: options.maxItems,
    maxLength: 64,
    minItems: options.minItems
  });

  if (!values.ok) {
    return values;
  }

  for (const entry of values.value) {
    if (!allowedValues.includes(entry as T)) {
      return fail(`${key} contains an invalid item.`);
    }
  }

  return ok(values.value as T[]);
}

export function readObject(
  source: Record<string, unknown>,
  key: string,
  allowedKeys: readonly string[]
): ValidationResult<Record<string, unknown>> {
  const raw = source[key];

  if (!isPlainObject(raw)) {
    return fail(`${key} is invalid.`);
  }

  const unknownKeys = Object.keys(raw).filter((entry) => !allowedKeys.includes(entry));

  if (unknownKeys.length) {
    return fail(`${key} contains unsupported fields.`);
  }

  return ok(raw);
}

export function validateIdentifier(
  value: string,
  key: string,
  options: {
    maxLength?: number;
    pattern?: RegExp;
  } = {}
): ValidationResult<string> {
  const normalized = normalizeStringValue(value, false);

  if (!normalized) {
    return fail(`${key} is required.`);
  }

  const maxLength = options.maxLength ?? 120;

  if (normalized.length > maxLength) {
    return fail(`${key} is too long.`);
  }

  if (options.pattern && !options.pattern.test(normalized)) {
    return fail(`${key} is invalid.`);
  }

  return ok(normalized);
}

export function validateHttpsUrl(
  value: string,
  key: string,
  options: { maxLength?: number } = {}
): ValidationResult<string> {
  const normalized = normalizeStringValue(value, false);

  if (!normalized) {
    return fail(`${key} is required.`);
  }

  if (normalized.length > (options.maxLength ?? 300)) {
    return fail(`${key} is too long.`);
  }

  try {
    const url = new URL(normalized);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return fail(`${key} is invalid.`);
    }

    return ok(url.toString());
  } catch {
    return fail(`${key} is invalid.`);
  }
}
