import type { ZodType } from 'zod'

export function parseWithSchema<TSchema extends ZodType>(
  schema: TSchema,
  value: unknown,
) {
  return schema.parse(value)
}
