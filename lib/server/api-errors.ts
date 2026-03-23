import { NextResponse } from "next/server";

type ErrorContext = {
  route: string;
  details?: Record<string, unknown>;
};

export function buildJsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function buildInvalidJsonResponse() {
  return buildJsonError("Invalid request payload.", 400);
}

export function buildUnexpectedFieldsResponse() {
  return buildJsonError("Request contains unsupported fields.", 400);
}

export function buildValidationErrorResponse(message: string) {
  return buildJsonError(message, 400);
}

export function buildGenericServerErrorResponse(
  message = "Something went wrong while processing the request."
) {
  return buildJsonError(message, 500);
}

export function buildGenericUpstreamErrorResponse(
  message = "Unable to complete the upstream request."
) {
  return buildJsonError(message, 502);
}

export function logServerError(error: unknown, context: ErrorContext) {
  console.error(`[api] route=${context.route} server_error`, {
    details: context.details ?? {},
    error
  });
}

export function handleServerError(
  error: unknown,
  context: ErrorContext,
  message?: string
) {
  logServerError(error, context);
  return buildGenericServerErrorResponse(message);
}

export function handleUpstreamError(
  error: unknown,
  context: ErrorContext,
  message?: string
) {
  logServerError(error, context);
  return buildGenericUpstreamErrorResponse(message);
}
