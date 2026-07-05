import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { customFetch } from './custom-fetch';
import type { ErrorType } from './custom-fetch';

// ── Shared helpers ────────────────────────────────────────────────────────────

const withQueryKey = <T extends object, K>(query: T, queryKey: K): T & { queryKey: K } => {
  const result = { queryKey } as T & { queryKey: K };
  for (const key of Object.keys(query)) {
    if (key === 'queryKey') continue;
    Object.defineProperty(result, key, {
      enumerable: true,
      configurable: true,
      get: () => (query as Record<string, unknown>)[key],
    });
  }
  return result;
};

// ── Types ─────────────────────────────────────────────────────────────────────

export type EnrollmentClass = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  basePrice: number;
  discountPrice: number | null;
  status: 'draft' | 'published';
  level: 'pemula' | 'menengah' | 'lanjutan' | null;
  category: string | null;
  instructor: { id: string; name: string; photoUrl: string };
  moduleCount: number;
  totalDurationMinutes: number | null;
  totalDarsCount: number;
  completedDarsCount: number;
};

export type EnrollmentItem = {
  id: string;
  enrolledAt: string;
  class: EnrollmentClass;
};

export type DarsItem = {
  id: string;
  title: string;
  orderIndex: number;
  durationMinutes: number | null;
};

export type ClassDarsModule = {
  id: string;
  title: string;
  orderIndex: number;
  durationMinutes: number | null;
  dars: DarsItem[];
};

export type ProgressItem = {
  id: string;
  darsId: string;
  isCompleted: boolean;
  completedAt: string;
};

export type UpsertProgressRequest = {
  userId: string;
  darsId: string;
  isCompleted: boolean;
};

export type UpsertProgressResult = {
  id: string | null;
  darsId: string;
  isCompleted: boolean;
};

// ── useListEnrollments ────────────────────────────────────────────────────────

export const getListEnrollmentsUrl = (userId: string) =>
  `/api/enrollments?userId=${encodeURIComponent(userId)}`;

export const listEnrollments = async (
  userId: string,
  options?: RequestInit,
): Promise<EnrollmentItem[]> =>
  customFetch<EnrollmentItem[]>(getListEnrollmentsUrl(userId), {
    ...options,
    method: 'GET',
  });

export const getListEnrollmentsQueryKey = (userId: string) =>
  [`/api/enrollments`, { userId }] as const;

export const getListEnrollmentsQueryOptions = <
  TData = Awaited<ReturnType<typeof listEnrollments>>,
  TError = ErrorType<unknown>,
>(
  userId: string,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEnrollments>>, TError, TData>;
  },
) => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListEnrollmentsQueryKey(userId);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof listEnrollments>>> = ({ signal }) =>
    listEnrollments(userId, { signal });
  return { queryKey, queryFn, enabled: !!userId, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof listEnrollments>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useListEnrollments<
  TData = Awaited<ReturnType<typeof listEnrollments>>,
  TError = ErrorType<unknown>,
>(
  userId: string,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEnrollments>>, TError, TData>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListEnrollmentsQueryOptions(userId, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return withQueryKey(query, queryOptions.queryKey);
}

// ── useGetClassDars ───────────────────────────────────────────────────────────

export const getClassDarsUrl = (classId: string) => `/api/classes/${classId}/dars`;

export const getClassDars = async (
  classId: string,
  options?: RequestInit,
): Promise<ClassDarsModule[]> =>
  customFetch<ClassDarsModule[]>(getClassDarsUrl(classId), {
    ...options,
    method: 'GET',
  });

export const getClassDarsQueryKey = (classId: string) =>
  [`/api/classes/${classId}/dars`] as const;

export const getClassDarsQueryOptions = <
  TData = Awaited<ReturnType<typeof getClassDars>>,
  TError = ErrorType<unknown>,
>(
  classId: string,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getClassDars>>, TError, TData>;
  },
) => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getClassDarsQueryKey(classId);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof getClassDars>>> = ({ signal }) =>
    getClassDars(classId, { signal });
  return { queryKey, queryFn, enabled: !!classId, ...queryOptions } as UseQueryOptions<
    Awaited<ReturnType<typeof getClassDars>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useGetClassDars<
  TData = Awaited<ReturnType<typeof getClassDars>>,
  TError = ErrorType<unknown>,
>(
  classId: string,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getClassDars>>, TError, TData>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getClassDarsQueryOptions(classId, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return withQueryKey(query, queryOptions.queryKey);
}

// ── useListProgress ───────────────────────────────────────────────────────────

export const getListProgressUrl = (userId: string, classId: string) =>
  `/api/progress?userId=${encodeURIComponent(userId)}&classId=${encodeURIComponent(classId)}`;

export const listProgress = async (
  userId: string,
  classId: string,
  options?: RequestInit,
): Promise<ProgressItem[]> =>
  customFetch<ProgressItem[]>(getListProgressUrl(userId, classId), {
    ...options,
    method: 'GET',
  });

export const getListProgressQueryKey = (userId: string, classId: string) =>
  [`/api/progress`, { userId, classId }] as const;

export const getListProgressQueryOptions = <
  TData = Awaited<ReturnType<typeof listProgress>>,
  TError = ErrorType<unknown>,
>(
  userId: string,
  classId: string,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProgress>>, TError, TData>;
  },
) => {
  const { query: queryOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getListProgressQueryKey(userId, classId);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof listProgress>>> = ({ signal }) =>
    listProgress(userId, classId, { signal });
  return {
    queryKey,
    queryFn,
    enabled: !!userId && !!classId,
    ...queryOptions,
  } as UseQueryOptions<Awaited<ReturnType<typeof listProgress>>, TError, TData> & {
    queryKey: QueryKey;
  };
};

export function useListProgress<
  TData = Awaited<ReturnType<typeof listProgress>>,
  TError = ErrorType<unknown>,
>(
  userId: string,
  classId: string,
  options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProgress>>, TError, TData>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListProgressQueryOptions(userId, classId, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & { queryKey: QueryKey };
  return withQueryKey(query, queryOptions.queryKey);
}

// ── useUpdateProgress ─────────────────────────────────────────────────────────

export const updateProgressUrl = () => `/api/progress`;

export const updateProgress = async (
  body: UpsertProgressRequest,
  options?: RequestInit,
): Promise<UpsertProgressResult> =>
  customFetch<UpsertProgressResult>(updateProgressUrl(), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(body),
  });

export const getUpdateProgressMutationOptions = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof updateProgress>>,
    TError,
    { data: UpsertProgressRequest },
    TContext
  >;
}): UseMutationOptions<
  Awaited<ReturnType<typeof updateProgress>>,
  TError,
  { data: UpsertProgressRequest },
  TContext
> => {
  const mutationKey = ['updateProgress'];
  const { mutation: mutationOptions } = options
    ? options.mutation && 'mutationKey' in options.mutation && options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey } };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof updateProgress>>,
    { data: UpsertProgressRequest }
  > = (props) => {
    const { data } = props ?? {};
    return updateProgress(data);
  };

  return { mutationFn, ...mutationOptions };
};

export function useUpdateProgress<TError = ErrorType<unknown>, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof updateProgress>>,
    TError,
    { data: UpsertProgressRequest },
    TContext
  >;
}): UseMutationResult<
  Awaited<ReturnType<typeof updateProgress>>,
  TError,
  { data: UpsertProgressRequest },
  TContext
> {
  return useMutation(getUpdateProgressMutationOptions(options));
}

// ── useInvalidateProgress (convenience) ──────────────────────────────────────

export function useInvalidateProgress() {
  const queryClient = useQueryClient();
  return (userId: string, classId: string) =>
    queryClient.invalidateQueries({ queryKey: getListProgressQueryKey(userId, classId) });
}
