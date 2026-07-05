import * as zod from 'zod';

export const ListEnrollmentsQueryParams = zod.object({
  "userId": zod.coerce.string(),
})

export const ListEnrollmentsResponseItem = zod.object({
  "id": zod.string().uuid(),
  "enrolledAt": zod.string(),
  "class": zod.object({
    "id": zod.string().uuid(),
    "title": zod.string(),
    "description": zod.string(),
    "coverImage": zod.string(),
    "basePrice": zod.number(),
    "discountPrice": zod.number().nullable(),
    "status": zod.enum(['draft', 'published']),
    "level": zod.union([zod.literal('pemula'), zod.literal('menengah'), zod.literal('lanjutan'), zod.literal(null)]).nullable(),
    "category": zod.string().nullable(),
    "instructor": zod.object({
      "id": zod.string().uuid(),
      "name": zod.string(),
      "photoUrl": zod.string(),
    }),
    "moduleCount": zod.number(),
    "totalDurationMinutes": zod.number().nullable(),
    "totalDarsCount": zod.number(),
    "completedDarsCount": zod.number(),
  }),
})
export const ListEnrollmentsResponse = zod.array(ListEnrollmentsResponseItem)

export const GetClassDarsParams = zod.object({
  "classId": zod.coerce.string().uuid(),
})

export const GetClassDarsResponseDars = zod.object({
  "id": zod.string().uuid(),
  "title": zod.string(),
  "orderIndex": zod.number(),
  "durationMinutes": zod.number().nullable(),
})

export const GetClassDarsResponseModule = zod.object({
  "id": zod.string().uuid(),
  "title": zod.string(),
  "orderIndex": zod.number(),
  "durationMinutes": zod.number().nullable(),
  "dars": zod.array(GetClassDarsResponseDars),
})

export const GetClassDarsResponse = zod.array(GetClassDarsResponseModule)

export const GetProgressQueryParams = zod.object({
  "userId": zod.coerce.string(),
  "classId": zod.coerce.string().uuid(),
})

export const GetProgressResponseItem = zod.object({
  "id": zod.string().uuid(),
  "darsId": zod.string().uuid(),
  "isCompleted": zod.boolean(),
  "completedAt": zod.string(),
})
export const GetProgressResponse = zod.array(GetProgressResponseItem)

export const UpsertProgressBody = zod.object({
  "userId": zod.string(),
  "darsId": zod.string().uuid(),
  "isCompleted": zod.boolean(),
})

export const UpsertProgressResponse = zod.object({
  "id": zod.string().uuid().nullable(),
  "darsId": zod.string().uuid(),
  "isCompleted": zod.boolean(),
})
