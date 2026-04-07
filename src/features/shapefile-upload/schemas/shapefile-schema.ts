import { z } from 'zod'

export const shapefileUploadSchema = z.object({
  name: z.string().min(1),
  size: z.number().nonnegative(),
  type: z.string().optional(),
})

export type ShapefileUploadInput = z.infer<typeof shapefileUploadSchema>
