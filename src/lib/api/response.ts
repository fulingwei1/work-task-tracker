import { NextResponse } from "next/server"

export interface ApiListMeta {
  total: number
  page: number
  limit: number
}

export interface ApiListResponse<T> {
  data: T[]
  meta: ApiListMeta
}

export interface ApiSingleResponse<T> {
  data: T
}

export interface ApiErrorResponse {
  error: string
  code?: string
}

export function successList<T>(
  data: T[],
  meta: ApiListMeta
): NextResponse<ApiListResponse<T>> {
  return NextResponse.json({ data, meta })
}

export function successSingle<T>(data: T): NextResponse<ApiSingleResponse<T>> {
  return NextResponse.json({ data })
}

export function errorResponse(
  error: string,
  status: number,
  code?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error, code }, { status })
}

export function badRequest(error: string, code?: string): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 400, code)
}

export function notFound(error: string = "Not found"): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 404)
}

export function forbidden(error: string = "Forbidden"): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 403)
}

export function serverError(error: string = "Internal server error"): NextResponse<ApiErrorResponse> {
  return errorResponse(error, 500)
}

export function parsePagination(
  searchParams: URLSearchParams,
  defaultLimit = 20,
  maxLimit = 100
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit), 10))
  )
  const skip = (page - 1) * limit

  return { page, limit, skip }
}
