import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { AdminDashboard, AdminRoleAssignment, AuditLogPage, AuthUserEnvelope, BatchUpdateResult, BeginBrowserLoginParams, Citizen, CitizenInput, CitizenZoneStatus, CommercialDashboard, DeliveryDetail, DeliveryOrder, DeliveryOrderInput, DeliveryProof, DeliverySummary, DistributionTask, DistributionTaskDetail, DistributionTaskInput, DistributionTaskPatch, Driver, DriverAssignment, DriverDashboard, DriverInput, DriverInvitation, DriverInviteInput, DriverSummary, DriverTask, ErrorEnvelope, GetAuditLogParams, GpsPosition, HandleBrowserLoginCallbackParams, HealthStatus, HumanitarianDashboard, ListAllUsersParams, ListDistributionTasksParams, ListDriverTasksParams, ListNgoApplicationsParams, ListNotificationsParams, ListProviderApplicationsParams, ListProviderDriversParams, ListProviderNgoTasksParams, ListProviderOrdersParams, LiveDriverLocation, LogoutSuccess, MobileTokenExchangeRequest, MobileTokenExchangeSuccess, Ngo, NgoApplication, NgoDashboard, NgoInput, Notification, Payment, PaymentInput, ProofInput, Provider, ProviderApplication, ProviderInput, ProviderMapData, ProviderNgoTask, ProviderPatch, ProviderPerformance, ProviderSummary, RejectionNote, RoleClaim, SignalResponse, Subscription, SubscriptionInput, SystemConfig, SystemConfigPatch, UserListPage, UserRoleProfile, Zone, ZoneHeatmapEntry, ZoneInput, ZonePatch, ZonePriorityScore } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetCurrentAuthUserUrl: () => string;
/**
 * @summary Get the currently authenticated user
 */
export declare const getCurrentAuthUser: (options?: RequestInit) => Promise<AuthUserEnvelope>;
export declare const getGetCurrentAuthUserQueryKey: () => readonly ["/api/auth/user"];
export declare const getGetCurrentAuthUserQueryOptions: <TData = Awaited<ReturnType<typeof getCurrentAuthUser>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentAuthUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCurrentAuthUser>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCurrentAuthUserQueryResult = NonNullable<Awaited<ReturnType<typeof getCurrentAuthUser>>>;
export type GetCurrentAuthUserQueryError = ErrorType<unknown>;
/**
 * @summary Get the currently authenticated user
 */
export declare function useGetCurrentAuthUser<TData = Awaited<ReturnType<typeof getCurrentAuthUser>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentAuthUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getBeginBrowserLoginUrl: (params?: BeginBrowserLoginParams) => string;
/**
 * @summary Start the browser OIDC login flow
 */
export declare const beginBrowserLogin: (params?: BeginBrowserLoginParams, options?: RequestInit) => Promise<unknown>;
export declare const getBeginBrowserLoginQueryKey: (params?: BeginBrowserLoginParams) => readonly ["/api/login", ...BeginBrowserLoginParams[]];
export declare const getBeginBrowserLoginQueryOptions: <TData = Awaited<ReturnType<typeof beginBrowserLogin>>, TError = ErrorType<void>>(params?: BeginBrowserLoginParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof beginBrowserLogin>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof beginBrowserLogin>>, TError, TData> & {
    queryKey: QueryKey;
};
export type BeginBrowserLoginQueryResult = NonNullable<Awaited<ReturnType<typeof beginBrowserLogin>>>;
export type BeginBrowserLoginQueryError = ErrorType<void>;
/**
 * @summary Start the browser OIDC login flow
 */
export declare function useBeginBrowserLogin<TData = Awaited<ReturnType<typeof beginBrowserLogin>>, TError = ErrorType<void>>(params?: BeginBrowserLoginParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof beginBrowserLogin>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getHandleBrowserLoginCallbackUrl: (params?: HandleBrowserLoginCallbackParams) => string;
/**
 * @summary Complete the browser OIDC login flow
 */
export declare const handleBrowserLoginCallback: (params?: HandleBrowserLoginCallbackParams, options?: RequestInit) => Promise<unknown>;
export declare const getHandleBrowserLoginCallbackQueryKey: (params?: HandleBrowserLoginCallbackParams) => readonly ["/api/callback", ...HandleBrowserLoginCallbackParams[]];
export declare const getHandleBrowserLoginCallbackQueryOptions: <TData = Awaited<ReturnType<typeof handleBrowserLoginCallback>>, TError = ErrorType<void>>(params?: HandleBrowserLoginCallbackParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof handleBrowserLoginCallback>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof handleBrowserLoginCallback>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HandleBrowserLoginCallbackQueryResult = NonNullable<Awaited<ReturnType<typeof handleBrowserLoginCallback>>>;
export type HandleBrowserLoginCallbackQueryError = ErrorType<void>;
/**
 * @summary Complete the browser OIDC login flow
 */
export declare function useHandleBrowserLoginCallback<TData = Awaited<ReturnType<typeof handleBrowserLoginCallback>>, TError = ErrorType<void>>(params?: HandleBrowserLoginCallbackParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof handleBrowserLoginCallback>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getLogoutBrowserSessionUrl: () => string;
/**
 * @summary Clear the session and begin OIDC logout
 */
export declare const logoutBrowserSession: (options?: RequestInit) => Promise<unknown>;
export declare const getLogoutBrowserSessionQueryKey: () => readonly ["/api/logout"];
export declare const getLogoutBrowserSessionQueryOptions: <TData = Awaited<ReturnType<typeof logoutBrowserSession>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof logoutBrowserSession>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof logoutBrowserSession>>, TError, TData> & {
    queryKey: QueryKey;
};
export type LogoutBrowserSessionQueryResult = NonNullable<Awaited<ReturnType<typeof logoutBrowserSession>>>;
export type LogoutBrowserSessionQueryError = ErrorType<void>;
/**
 * @summary Clear the session and begin OIDC logout
 */
export declare function useLogoutBrowserSession<TData = Awaited<ReturnType<typeof logoutBrowserSession>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof logoutBrowserSession>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getExchangeMobileAuthorizationCodeUrl: () => string;
/**
 * @summary Exchange a mobile OIDC code for a session token
 */
export declare const exchangeMobileAuthorizationCode: (mobileTokenExchangeRequest: MobileTokenExchangeRequest, options?: RequestInit) => Promise<MobileTokenExchangeSuccess>;
export declare const getExchangeMobileAuthorizationCodeMutationOptions: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof exchangeMobileAuthorizationCode>>, TError, {
        data: BodyType<MobileTokenExchangeRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof exchangeMobileAuthorizationCode>>, TError, {
    data: BodyType<MobileTokenExchangeRequest>;
}, TContext>;
export type ExchangeMobileAuthorizationCodeMutationResult = NonNullable<Awaited<ReturnType<typeof exchangeMobileAuthorizationCode>>>;
export type ExchangeMobileAuthorizationCodeMutationBody = BodyType<MobileTokenExchangeRequest>;
export type ExchangeMobileAuthorizationCodeMutationError = ErrorType<ErrorEnvelope>;
/**
* @summary Exchange a mobile OIDC code for a session token
*/
export declare const useExchangeMobileAuthorizationCode: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof exchangeMobileAuthorizationCode>>, TError, {
        data: BodyType<MobileTokenExchangeRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof exchangeMobileAuthorizationCode>>, TError, {
    data: BodyType<MobileTokenExchangeRequest>;
}, TContext>;
export declare const getLogoutMobileSessionUrl: () => string;
/**
 * @summary Delete a mobile session token
 */
export declare const logoutMobileSession: (options?: RequestInit) => Promise<LogoutSuccess>;
export declare const getLogoutMobileSessionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logoutMobileSession>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logoutMobileSession>>, TError, void, TContext>;
export type LogoutMobileSessionMutationResult = NonNullable<Awaited<ReturnType<typeof logoutMobileSession>>>;
export type LogoutMobileSessionMutationError = ErrorType<unknown>;
/**
* @summary Delete a mobile session token
*/
export declare const useLogoutMobileSession: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logoutMobileSession>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logoutMobileSession>>, TError, void, TContext>;
export declare const getGetMyRoleUrl: () => string;
/**
 * @summary Get current user's platform role and profile
 */
export declare const getMyRole: (options?: RequestInit) => Promise<UserRoleProfile>;
export declare const getGetMyRoleQueryKey: () => readonly ["/api/users/me/role"];
export declare const getGetMyRoleQueryOptions: <TData = Awaited<ReturnType<typeof getMyRole>>, TError = ErrorType<ErrorEnvelope>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyRole>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyRole>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyRoleQueryResult = NonNullable<Awaited<ReturnType<typeof getMyRole>>>;
export type GetMyRoleQueryError = ErrorType<ErrorEnvelope>;
/**
 * @summary Get current user's platform role and profile
 */
export declare function useGetMyRole<TData = Awaited<ReturnType<typeof getMyRole>>, TError = ErrorType<ErrorEnvelope>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyRole>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAssignMyRoleUrl: () => string;
/**
 * @summary Claim an initial role (citizen self-registration, or first-time onboarding)
 */
export declare const assignMyRole: (roleClaim: RoleClaim, options?: RequestInit) => Promise<UserRoleProfile>;
export declare const getAssignMyRoleMutationOptions: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof assignMyRole>>, TError, {
        data: BodyType<RoleClaim>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof assignMyRole>>, TError, {
    data: BodyType<RoleClaim>;
}, TContext>;
export type AssignMyRoleMutationResult = NonNullable<Awaited<ReturnType<typeof assignMyRole>>>;
export type AssignMyRoleMutationBody = BodyType<RoleClaim>;
export type AssignMyRoleMutationError = ErrorType<ErrorEnvelope>;
/**
* @summary Claim an initial role (citizen self-registration, or first-time onboarding)
*/
export declare const useAssignMyRole: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof assignMyRole>>, TError, {
        data: BodyType<RoleClaim>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof assignMyRole>>, TError, {
    data: BodyType<RoleClaim>;
}, TContext>;
export declare const getGetAdminDashboardUrl: () => string;
/**
 * @summary Global platform statistics
 */
export declare const getAdminDashboard: (options?: RequestInit) => Promise<AdminDashboard>;
export declare const getGetAdminDashboardQueryKey: () => readonly ["/api/admin/dashboard"];
export declare const getGetAdminDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getAdminDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAdminDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminDashboard>>>;
export type GetAdminDashboardQueryError = ErrorType<unknown>;
/**
 * @summary Global platform statistics
 */
export declare function useGetAdminDashboard<TData = Awaited<ReturnType<typeof getAdminDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListNgoApplicationsUrl: (params?: ListNgoApplicationsParams) => string;
/**
 * @summary List NGO applications
 */
export declare const listNgoApplications: (params?: ListNgoApplicationsParams, options?: RequestInit) => Promise<NgoApplication[]>;
export declare const getListNgoApplicationsQueryKey: (params?: ListNgoApplicationsParams) => readonly ["/api/admin/applications/ngos", ...ListNgoApplicationsParams[]];
export declare const getListNgoApplicationsQueryOptions: <TData = Awaited<ReturnType<typeof listNgoApplications>>, TError = ErrorType<unknown>>(params?: ListNgoApplicationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listNgoApplications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listNgoApplications>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListNgoApplicationsQueryResult = NonNullable<Awaited<ReturnType<typeof listNgoApplications>>>;
export type ListNgoApplicationsQueryError = ErrorType<unknown>;
/**
 * @summary List NGO applications
 */
export declare function useListNgoApplications<TData = Awaited<ReturnType<typeof listNgoApplications>>, TError = ErrorType<unknown>>(params?: ListNgoApplicationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listNgoApplications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getApproveNgoApplicationUrl: (id: string) => string;
/**
 * @summary Approve an NGO application
 */
export declare const approveNgoApplication: (id: string, options?: RequestInit) => Promise<NgoApplication>;
export declare const getApproveNgoApplicationMutationOptions: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approveNgoApplication>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof approveNgoApplication>>, TError, {
    id: string;
}, TContext>;
export type ApproveNgoApplicationMutationResult = NonNullable<Awaited<ReturnType<typeof approveNgoApplication>>>;
export type ApproveNgoApplicationMutationError = ErrorType<ErrorEnvelope>;
/**
* @summary Approve an NGO application
*/
export declare const useApproveNgoApplication: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approveNgoApplication>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof approveNgoApplication>>, TError, {
    id: string;
}, TContext>;
export declare const getRejectNgoApplicationUrl: (id: string) => string;
/**
 * @summary Reject an NGO application
 */
export declare const rejectNgoApplication: (id: string, rejectionNote: RejectionNote, options?: RequestInit) => Promise<NgoApplication>;
export declare const getRejectNgoApplicationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectNgoApplication>>, TError, {
        id: string;
        data: BodyType<RejectionNote>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof rejectNgoApplication>>, TError, {
    id: string;
    data: BodyType<RejectionNote>;
}, TContext>;
export type RejectNgoApplicationMutationResult = NonNullable<Awaited<ReturnType<typeof rejectNgoApplication>>>;
export type RejectNgoApplicationMutationBody = BodyType<RejectionNote>;
export type RejectNgoApplicationMutationError = ErrorType<unknown>;
/**
* @summary Reject an NGO application
*/
export declare const useRejectNgoApplication: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectNgoApplication>>, TError, {
        id: string;
        data: BodyType<RejectionNote>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof rejectNgoApplication>>, TError, {
    id: string;
    data: BodyType<RejectionNote>;
}, TContext>;
export declare const getListProviderApplicationsUrl: (params?: ListProviderApplicationsParams) => string;
/**
 * @summary List service provider applications
 */
export declare const listProviderApplications: (params?: ListProviderApplicationsParams, options?: RequestInit) => Promise<ProviderApplication[]>;
export declare const getListProviderApplicationsQueryKey: (params?: ListProviderApplicationsParams) => readonly ["/api/admin/applications/providers", ...ListProviderApplicationsParams[]];
export declare const getListProviderApplicationsQueryOptions: <TData = Awaited<ReturnType<typeof listProviderApplications>>, TError = ErrorType<unknown>>(params?: ListProviderApplicationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProviderApplications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProviderApplications>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProviderApplicationsQueryResult = NonNullable<Awaited<ReturnType<typeof listProviderApplications>>>;
export type ListProviderApplicationsQueryError = ErrorType<unknown>;
/**
 * @summary List service provider applications
 */
export declare function useListProviderApplications<TData = Awaited<ReturnType<typeof listProviderApplications>>, TError = ErrorType<unknown>>(params?: ListProviderApplicationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProviderApplications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getApproveProviderApplicationUrl: (id: string) => string;
/**
 * @summary Approve a service provider application
 */
export declare const approveProviderApplication: (id: string, options?: RequestInit) => Promise<ProviderApplication>;
export declare const getApproveProviderApplicationMutationOptions: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approveProviderApplication>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof approveProviderApplication>>, TError, {
    id: string;
}, TContext>;
export type ApproveProviderApplicationMutationResult = NonNullable<Awaited<ReturnType<typeof approveProviderApplication>>>;
export type ApproveProviderApplicationMutationError = ErrorType<ErrorEnvelope>;
/**
* @summary Approve a service provider application
*/
export declare const useApproveProviderApplication: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approveProviderApplication>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof approveProviderApplication>>, TError, {
    id: string;
}, TContext>;
export declare const getRejectProviderApplicationUrl: (id: string) => string;
/**
 * @summary Reject a service provider application
 */
export declare const rejectProviderApplication: (id: string, rejectionNote: RejectionNote, options?: RequestInit) => Promise<ProviderApplication>;
export declare const getRejectProviderApplicationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectProviderApplication>>, TError, {
        id: string;
        data: BodyType<RejectionNote>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof rejectProviderApplication>>, TError, {
    id: string;
    data: BodyType<RejectionNote>;
}, TContext>;
export type RejectProviderApplicationMutationResult = NonNullable<Awaited<ReturnType<typeof rejectProviderApplication>>>;
export type RejectProviderApplicationMutationBody = BodyType<RejectionNote>;
export type RejectProviderApplicationMutationError = ErrorType<unknown>;
/**
* @summary Reject a service provider application
*/
export declare const useRejectProviderApplication: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectProviderApplication>>, TError, {
        id: string;
        data: BodyType<RejectionNote>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof rejectProviderApplication>>, TError, {
    id: string;
    data: BodyType<RejectionNote>;
}, TContext>;
export declare const getGetSystemConfigUrl: () => string;
/**
 * @summary Get system-wide configuration
 */
export declare const getSystemConfig: (options?: RequestInit) => Promise<SystemConfig>;
export declare const getGetSystemConfigQueryKey: () => readonly ["/api/admin/system-config"];
export declare const getGetSystemConfigQueryOptions: <TData = Awaited<ReturnType<typeof getSystemConfig>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSystemConfig>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSystemConfig>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSystemConfigQueryResult = NonNullable<Awaited<ReturnType<typeof getSystemConfig>>>;
export type GetSystemConfigQueryError = ErrorType<unknown>;
/**
 * @summary Get system-wide configuration
 */
export declare function useGetSystemConfig<TData = Awaited<ReturnType<typeof getSystemConfig>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSystemConfig>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateSystemConfigUrl: () => string;
/**
 * @summary Update system-wide configuration
 */
export declare const updateSystemConfig: (systemConfigPatch: SystemConfigPatch, options?: RequestInit) => Promise<SystemConfig>;
export declare const getUpdateSystemConfigMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSystemConfig>>, TError, {
        data: BodyType<SystemConfigPatch>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSystemConfig>>, TError, {
    data: BodyType<SystemConfigPatch>;
}, TContext>;
export type UpdateSystemConfigMutationResult = NonNullable<Awaited<ReturnType<typeof updateSystemConfig>>>;
export type UpdateSystemConfigMutationBody = BodyType<SystemConfigPatch>;
export type UpdateSystemConfigMutationError = ErrorType<unknown>;
/**
* @summary Update system-wide configuration
*/
export declare const useUpdateSystemConfig: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSystemConfig>>, TError, {
        data: BodyType<SystemConfigPatch>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSystemConfig>>, TError, {
    data: BodyType<SystemConfigPatch>;
}, TContext>;
export declare const getGetAuditLogUrl: (params?: GetAuditLogParams) => string;
/**
 * @summary Get audit log entries
 */
export declare const getAuditLog: (params?: GetAuditLogParams, options?: RequestInit) => Promise<AuditLogPage>;
export declare const getGetAuditLogQueryKey: (params?: GetAuditLogParams) => readonly ["/api/admin/audit-log", ...GetAuditLogParams[]];
export declare const getGetAuditLogQueryOptions: <TData = Awaited<ReturnType<typeof getAuditLog>>, TError = ErrorType<unknown>>(params?: GetAuditLogParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAuditLog>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAuditLog>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAuditLogQueryResult = NonNullable<Awaited<ReturnType<typeof getAuditLog>>>;
export type GetAuditLogQueryError = ErrorType<unknown>;
/**
 * @summary Get audit log entries
 */
export declare function useGetAuditLog<TData = Awaited<ReturnType<typeof getAuditLog>>, TError = ErrorType<unknown>>(params?: GetAuditLogParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAuditLog>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListAllUsersUrl: (params?: ListAllUsersParams) => string;
/**
 * @summary List all platform users
 */
export declare const listAllUsers: (params?: ListAllUsersParams, options?: RequestInit) => Promise<UserListPage>;
export declare const getListAllUsersQueryKey: (params?: ListAllUsersParams) => readonly ["/api/admin/users", ...ListAllUsersParams[]];
export declare const getListAllUsersQueryOptions: <TData = Awaited<ReturnType<typeof listAllUsers>>, TError = ErrorType<unknown>>(params?: ListAllUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAllUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAllUsers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAllUsersQueryResult = NonNullable<Awaited<ReturnType<typeof listAllUsers>>>;
export type ListAllUsersQueryError = ErrorType<unknown>;
/**
 * @summary List all platform users
 */
export declare function useListAllUsers<TData = Awaited<ReturnType<typeof listAllUsers>>, TError = ErrorType<unknown>>(params?: ListAllUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAllUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAdminSetUserRoleUrl: (userId: string) => string;
/**
 * @summary Admin sets a user's role
 */
export declare const adminSetUserRole: (userId: string, adminRoleAssignment: AdminRoleAssignment, options?: RequestInit) => Promise<UserRoleProfile>;
export declare const getAdminSetUserRoleMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminSetUserRole>>, TError, {
        userId: string;
        data: BodyType<AdminRoleAssignment>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof adminSetUserRole>>, TError, {
    userId: string;
    data: BodyType<AdminRoleAssignment>;
}, TContext>;
export type AdminSetUserRoleMutationResult = NonNullable<Awaited<ReturnType<typeof adminSetUserRole>>>;
export type AdminSetUserRoleMutationBody = BodyType<AdminRoleAssignment>;
export type AdminSetUserRoleMutationError = ErrorType<unknown>;
/**
* @summary Admin sets a user's role
*/
export declare const useAdminSetUserRole: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof adminSetUserRole>>, TError, {
        userId: string;
        data: BodyType<AdminRoleAssignment>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof adminSetUserRole>>, TError, {
    userId: string;
    data: BodyType<AdminRoleAssignment>;
}, TContext>;
export declare const getApplyAsNgoUrl: () => string;
/**
 * @summary Submit an NGO application
 */
export declare const applyAsNgo: (ngoInput: NgoInput, options?: RequestInit) => Promise<Ngo>;
export declare const getApplyAsNgoMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof applyAsNgo>>, TError, {
        data: BodyType<NgoInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof applyAsNgo>>, TError, {
    data: BodyType<NgoInput>;
}, TContext>;
export type ApplyAsNgoMutationResult = NonNullable<Awaited<ReturnType<typeof applyAsNgo>>>;
export type ApplyAsNgoMutationBody = BodyType<NgoInput>;
export type ApplyAsNgoMutationError = ErrorType<unknown>;
/**
* @summary Submit an NGO application
*/
export declare const useApplyAsNgo: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof applyAsNgo>>, TError, {
        data: BodyType<NgoInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof applyAsNgo>>, TError, {
    data: BodyType<NgoInput>;
}, TContext>;
export declare const getGetMyNgoUrl: () => string;
/**
 * @summary Get current NGO profile
 */
export declare const getMyNgo: (options?: RequestInit) => Promise<Ngo>;
export declare const getGetMyNgoQueryKey: () => readonly ["/api/ngos/me"];
export declare const getGetMyNgoQueryOptions: <TData = Awaited<ReturnType<typeof getMyNgo>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyNgo>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyNgo>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyNgoQueryResult = NonNullable<Awaited<ReturnType<typeof getMyNgo>>>;
export type GetMyNgoQueryError = ErrorType<unknown>;
/**
 * @summary Get current NGO profile
 */
export declare function useGetMyNgo<TData = Awaited<ReturnType<typeof getMyNgo>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyNgo>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetNgoDashboardUrl: () => string;
/**
 * @summary NGO overview — zones with priority scores and delivery progress
 */
export declare const getNgoDashboard: (options?: RequestInit) => Promise<NgoDashboard>;
export declare const getGetNgoDashboardQueryKey: () => readonly ["/api/ngos/me/dashboard"];
export declare const getGetNgoDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getNgoDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getNgoDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getNgoDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetNgoDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getNgoDashboard>>>;
export type GetNgoDashboardQueryError = ErrorType<unknown>;
/**
 * @summary NGO overview — zones with priority scores and delivery progress
 */
export declare function useGetNgoDashboard<TData = Awaited<ReturnType<typeof getNgoDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getNgoDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListMyZonesUrl: () => string;
/**
 * @summary List coverage zones belonging to this NGO
 */
export declare const listMyZones: (options?: RequestInit) => Promise<Zone[]>;
export declare const getListMyZonesQueryKey: () => readonly ["/api/ngos/me/zones"];
export declare const getListMyZonesQueryOptions: <TData = Awaited<ReturnType<typeof listMyZones>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMyZones>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listMyZones>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListMyZonesQueryResult = NonNullable<Awaited<ReturnType<typeof listMyZones>>>;
export type ListMyZonesQueryError = ErrorType<unknown>;
/**
 * @summary List coverage zones belonging to this NGO
 */
export declare function useListMyZones<TData = Awaited<ReturnType<typeof listMyZones>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMyZones>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateZoneUrl: () => string;
/**
 * @summary Create a coverage zone
 */
export declare const createZone: (zoneInput: ZoneInput, options?: RequestInit) => Promise<Zone>;
export declare const getCreateZoneMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createZone>>, TError, {
        data: BodyType<ZoneInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createZone>>, TError, {
    data: BodyType<ZoneInput>;
}, TContext>;
export type CreateZoneMutationResult = NonNullable<Awaited<ReturnType<typeof createZone>>>;
export type CreateZoneMutationBody = BodyType<ZoneInput>;
export type CreateZoneMutationError = ErrorType<unknown>;
/**
* @summary Create a coverage zone
*/
export declare const useCreateZone: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createZone>>, TError, {
        data: BodyType<ZoneInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createZone>>, TError, {
    data: BodyType<ZoneInput>;
}, TContext>;
export declare const getGetMyZoneUrl: (id: string) => string;
/**
 * @summary Get a zone by ID
 */
export declare const getMyZone: (id: string, options?: RequestInit) => Promise<Zone>;
export declare const getGetMyZoneQueryKey: (id: string) => readonly [`/api/ngos/me/zones/${string}`];
export declare const getGetMyZoneQueryOptions: <TData = Awaited<ReturnType<typeof getMyZone>>, TError = ErrorType<ErrorEnvelope>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyZone>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyZone>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyZoneQueryResult = NonNullable<Awaited<ReturnType<typeof getMyZone>>>;
export type GetMyZoneQueryError = ErrorType<ErrorEnvelope>;
/**
 * @summary Get a zone by ID
 */
export declare function useGetMyZone<TData = Awaited<ReturnType<typeof getMyZone>>, TError = ErrorType<ErrorEnvelope>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyZone>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateMyZoneUrl: (id: string) => string;
/**
 * @summary Update a coverage zone
 */
export declare const updateMyZone: (id: string, zonePatch: ZonePatch, options?: RequestInit) => Promise<Zone>;
export declare const getUpdateMyZoneMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMyZone>>, TError, {
        id: string;
        data: BodyType<ZonePatch>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateMyZone>>, TError, {
    id: string;
    data: BodyType<ZonePatch>;
}, TContext>;
export type UpdateMyZoneMutationResult = NonNullable<Awaited<ReturnType<typeof updateMyZone>>>;
export type UpdateMyZoneMutationBody = BodyType<ZonePatch>;
export type UpdateMyZoneMutationError = ErrorType<unknown>;
/**
* @summary Update a coverage zone
*/
export declare const useUpdateMyZone: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMyZone>>, TError, {
        id: string;
        data: BodyType<ZonePatch>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateMyZone>>, TError, {
    id: string;
    data: BodyType<ZonePatch>;
}, TContext>;
export declare const getDeleteMyZoneUrl: (id: string) => string;
/**
 * @summary Delete a coverage zone
 */
export declare const deleteMyZone: (id: string, options?: RequestInit) => Promise<void>;
export declare const getDeleteMyZoneMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteMyZone>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteMyZone>>, TError, {
    id: string;
}, TContext>;
export type DeleteMyZoneMutationResult = NonNullable<Awaited<ReturnType<typeof deleteMyZone>>>;
export type DeleteMyZoneMutationError = ErrorType<unknown>;
/**
* @summary Delete a coverage zone
*/
export declare const useDeleteMyZone: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteMyZone>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteMyZone>>, TError, {
    id: string;
}, TContext>;
export declare const getListDistributionTasksUrl: (params?: ListDistributionTasksParams) => string;
/**
 * @summary List distribution tasks created by this NGO
 */
export declare const listDistributionTasks: (params?: ListDistributionTasksParams, options?: RequestInit) => Promise<DistributionTask[]>;
export declare const getListDistributionTasksQueryKey: (params?: ListDistributionTasksParams) => readonly ["/api/ngos/me/distribution-tasks", ...ListDistributionTasksParams[]];
export declare const getListDistributionTasksQueryOptions: <TData = Awaited<ReturnType<typeof listDistributionTasks>>, TError = ErrorType<unknown>>(params?: ListDistributionTasksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDistributionTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listDistributionTasks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListDistributionTasksQueryResult = NonNullable<Awaited<ReturnType<typeof listDistributionTasks>>>;
export type ListDistributionTasksQueryError = ErrorType<unknown>;
/**
 * @summary List distribution tasks created by this NGO
 */
export declare function useListDistributionTasks<TData = Awaited<ReturnType<typeof listDistributionTasks>>, TError = ErrorType<unknown>>(params?: ListDistributionTasksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDistributionTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateDistributionTaskUrl: () => string;
/**
 * @summary Create a new distribution task
 */
export declare const createDistributionTask: (distributionTaskInput: DistributionTaskInput, options?: RequestInit) => Promise<DistributionTask>;
export declare const getCreateDistributionTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDistributionTask>>, TError, {
        data: BodyType<DistributionTaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createDistributionTask>>, TError, {
    data: BodyType<DistributionTaskInput>;
}, TContext>;
export type CreateDistributionTaskMutationResult = NonNullable<Awaited<ReturnType<typeof createDistributionTask>>>;
export type CreateDistributionTaskMutationBody = BodyType<DistributionTaskInput>;
export type CreateDistributionTaskMutationError = ErrorType<unknown>;
/**
* @summary Create a new distribution task
*/
export declare const useCreateDistributionTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDistributionTask>>, TError, {
        data: BodyType<DistributionTaskInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createDistributionTask>>, TError, {
    data: BodyType<DistributionTaskInput>;
}, TContext>;
export declare const getGetDistributionTaskUrl: (id: string) => string;
/**
 * @summary Get distribution task detail with delivery progress
 */
export declare const getDistributionTask: (id: string, options?: RequestInit) => Promise<DistributionTaskDetail>;
export declare const getGetDistributionTaskQueryKey: (id: string) => readonly [`/api/ngos/me/distribution-tasks/${string}`];
export declare const getGetDistributionTaskQueryOptions: <TData = Awaited<ReturnType<typeof getDistributionTask>>, TError = ErrorType<ErrorEnvelope>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDistributionTask>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDistributionTask>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDistributionTaskQueryResult = NonNullable<Awaited<ReturnType<typeof getDistributionTask>>>;
export type GetDistributionTaskQueryError = ErrorType<ErrorEnvelope>;
/**
 * @summary Get distribution task detail with delivery progress
 */
export declare function useGetDistributionTask<TData = Awaited<ReturnType<typeof getDistributionTask>>, TError = ErrorType<ErrorEnvelope>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDistributionTask>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateDistributionTaskUrl: (id: string) => string;
/**
 * @summary Update a distribution task
 */
export declare const updateDistributionTask: (id: string, distributionTaskPatch: DistributionTaskPatch, options?: RequestInit) => Promise<DistributionTask>;
export declare const getUpdateDistributionTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDistributionTask>>, TError, {
        id: string;
        data: BodyType<DistributionTaskPatch>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateDistributionTask>>, TError, {
    id: string;
    data: BodyType<DistributionTaskPatch>;
}, TContext>;
export type UpdateDistributionTaskMutationResult = NonNullable<Awaited<ReturnType<typeof updateDistributionTask>>>;
export type UpdateDistributionTaskMutationBody = BodyType<DistributionTaskPatch>;
export type UpdateDistributionTaskMutationError = ErrorType<unknown>;
/**
* @summary Update a distribution task
*/
export declare const useUpdateDistributionTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDistributionTask>>, TError, {
        id: string;
        data: BodyType<DistributionTaskPatch>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateDistributionTask>>, TError, {
    id: string;
    data: BodyType<DistributionTaskPatch>;
}, TContext>;
export declare const getListAvailableProvidersUrl: () => string;
/**
 * @summary List approved service providers available for NGO task assignment
 */
export declare const listAvailableProviders: (options?: RequestInit) => Promise<ProviderSummary[]>;
export declare const getListAvailableProvidersQueryKey: () => readonly ["/api/ngos/me/providers"];
export declare const getListAvailableProvidersQueryOptions: <TData = Awaited<ReturnType<typeof listAvailableProviders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAvailableProviders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAvailableProviders>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAvailableProvidersQueryResult = NonNullable<Awaited<ReturnType<typeof listAvailableProviders>>>;
export type ListAvailableProvidersQueryError = ErrorType<unknown>;
/**
 * @summary List approved service providers available for NGO task assignment
 */
export declare function useListAvailableProviders<TData = Awaited<ReturnType<typeof listAvailableProviders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAvailableProviders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetProviderPerformanceUrl: (providerId: string) => string;
/**
 * @summary Get a provider's performance metrics
 */
export declare const getProviderPerformance: (providerId: string, options?: RequestInit) => Promise<ProviderPerformance>;
export declare const getGetProviderPerformanceQueryKey: (providerId: string) => readonly [`/api/ngos/me/providers/${string}/performance`];
export declare const getGetProviderPerformanceQueryOptions: <TData = Awaited<ReturnType<typeof getProviderPerformance>>, TError = ErrorType<unknown>>(providerId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProviderPerformance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProviderPerformance>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProviderPerformanceQueryResult = NonNullable<Awaited<ReturnType<typeof getProviderPerformance>>>;
export type GetProviderPerformanceQueryError = ErrorType<unknown>;
/**
 * @summary Get a provider's performance metrics
 */
export declare function useGetProviderPerformance<TData = Awaited<ReturnType<typeof getProviderPerformance>>, TError = ErrorType<unknown>>(providerId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProviderPerformance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getApplyAsProviderUrl: () => string;
/**
 * @summary Submit a service provider application
 */
export declare const applyAsProvider: (providerInput: ProviderInput, options?: RequestInit) => Promise<Provider>;
export declare const getApplyAsProviderMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof applyAsProvider>>, TError, {
        data: BodyType<ProviderInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof applyAsProvider>>, TError, {
    data: BodyType<ProviderInput>;
}, TContext>;
export type ApplyAsProviderMutationResult = NonNullable<Awaited<ReturnType<typeof applyAsProvider>>>;
export type ApplyAsProviderMutationBody = BodyType<ProviderInput>;
export type ApplyAsProviderMutationError = ErrorType<unknown>;
/**
* @summary Submit a service provider application
*/
export declare const useApplyAsProvider: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof applyAsProvider>>, TError, {
        data: BodyType<ProviderInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof applyAsProvider>>, TError, {
    data: BodyType<ProviderInput>;
}, TContext>;
export declare const getGetMyProviderUrl: () => string;
/**
 * @summary Get current provider profile
 */
export declare const getMyProvider: (options?: RequestInit) => Promise<Provider>;
export declare const getGetMyProviderQueryKey: () => readonly ["/api/providers/me"];
export declare const getGetMyProviderQueryOptions: <TData = Awaited<ReturnType<typeof getMyProvider>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyProvider>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyProvider>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyProviderQueryResult = NonNullable<Awaited<ReturnType<typeof getMyProvider>>>;
export type GetMyProviderQueryError = ErrorType<unknown>;
/**
 * @summary Get current provider profile
 */
export declare function useGetMyProvider<TData = Awaited<ReturnType<typeof getMyProvider>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyProvider>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateMyProviderUrl: () => string;
/**
 * @summary Update provider profile (mode settings)
 */
export declare const updateMyProvider: (providerPatch: ProviderPatch, options?: RequestInit) => Promise<Provider>;
export declare const getUpdateMyProviderMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMyProvider>>, TError, {
        data: BodyType<ProviderPatch>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateMyProvider>>, TError, {
    data: BodyType<ProviderPatch>;
}, TContext>;
export type UpdateMyProviderMutationResult = NonNullable<Awaited<ReturnType<typeof updateMyProvider>>>;
export type UpdateMyProviderMutationBody = BodyType<ProviderPatch>;
export type UpdateMyProviderMutationError = ErrorType<unknown>;
/**
* @summary Update provider profile (mode settings)
*/
export declare const useUpdateMyProvider: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMyProvider>>, TError, {
        data: BodyType<ProviderPatch>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateMyProvider>>, TError, {
    data: BodyType<ProviderPatch>;
}, TContext>;
export declare const getGetHumanitarianDashboardUrl: () => string;
/**
 * @summary Humanitarian operations dashboard — task completion, zone coverage, driver utilisation
 */
export declare const getHumanitarianDashboard: (options?: RequestInit) => Promise<HumanitarianDashboard>;
export declare const getGetHumanitarianDashboardQueryKey: () => readonly ["/api/providers/me/dashboard/humanitarian"];
export declare const getGetHumanitarianDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getHumanitarianDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getHumanitarianDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getHumanitarianDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetHumanitarianDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getHumanitarianDashboard>>>;
export type GetHumanitarianDashboardQueryError = ErrorType<unknown>;
/**
 * @summary Humanitarian operations dashboard — task completion, zone coverage, driver utilisation
 */
export declare function useGetHumanitarianDashboard<TData = Awaited<ReturnType<typeof getHumanitarianDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getHumanitarianDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetCommercialDashboardUrl: () => string;
/**
 * @summary Commercial revenue dashboard — earnings, subscriptions, platform fees
 */
export declare const getCommercialDashboard: (options?: RequestInit) => Promise<CommercialDashboard>;
export declare const getGetCommercialDashboardQueryKey: () => readonly ["/api/providers/me/dashboard/commercial"];
export declare const getGetCommercialDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getCommercialDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCommercialDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCommercialDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCommercialDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getCommercialDashboard>>>;
export type GetCommercialDashboardQueryError = ErrorType<unknown>;
/**
 * @summary Commercial revenue dashboard — earnings, subscriptions, platform fees
 */
export declare function useGetCommercialDashboard<TData = Awaited<ReturnType<typeof getCommercialDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCommercialDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListProviderNgoTasksUrl: (params?: ListProviderNgoTasksParams) => string;
/**
 * @summary List NGO-assigned distribution tasks for this provider
 */
export declare const listProviderNgoTasks: (params?: ListProviderNgoTasksParams, options?: RequestInit) => Promise<ProviderNgoTask[]>;
export declare const getListProviderNgoTasksQueryKey: (params?: ListProviderNgoTasksParams) => readonly ["/api/providers/me/ngo-tasks", ...ListProviderNgoTasksParams[]];
export declare const getListProviderNgoTasksQueryOptions: <TData = Awaited<ReturnType<typeof listProviderNgoTasks>>, TError = ErrorType<unknown>>(params?: ListProviderNgoTasksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProviderNgoTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProviderNgoTasks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProviderNgoTasksQueryResult = NonNullable<Awaited<ReturnType<typeof listProviderNgoTasks>>>;
export type ListProviderNgoTasksQueryError = ErrorType<unknown>;
/**
 * @summary List NGO-assigned distribution tasks for this provider
 */
export declare function useListProviderNgoTasks<TData = Awaited<ReturnType<typeof listProviderNgoTasks>>, TError = ErrorType<unknown>>(params?: ListProviderNgoTasksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProviderNgoTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAcknowledgeNgoTaskUrl: (taskId: string) => string;
/**
 * @summary Acknowledge receipt of an NGO-assigned task
 */
export declare const acknowledgeNgoTask: (taskId: string, options?: RequestInit) => Promise<ProviderNgoTask>;
export declare const getAcknowledgeNgoTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof acknowledgeNgoTask>>, TError, {
        taskId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof acknowledgeNgoTask>>, TError, {
    taskId: string;
}, TContext>;
export type AcknowledgeNgoTaskMutationResult = NonNullable<Awaited<ReturnType<typeof acknowledgeNgoTask>>>;
export type AcknowledgeNgoTaskMutationError = ErrorType<unknown>;
/**
* @summary Acknowledge receipt of an NGO-assigned task
*/
export declare const useAcknowledgeNgoTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof acknowledgeNgoTask>>, TError, {
        taskId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof acknowledgeNgoTask>>, TError, {
    taskId: string;
}, TContext>;
export declare const getAssignDriverToTaskUrl: (taskId: string) => string;
/**
 * @summary Assign an owned driver to an NGO task
 */
export declare const assignDriverToTask: (taskId: string, driverAssignment: DriverAssignment, options?: RequestInit) => Promise<ProviderNgoTask>;
export declare const getAssignDriverToTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof assignDriverToTask>>, TError, {
        taskId: string;
        data: BodyType<DriverAssignment>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof assignDriverToTask>>, TError, {
    taskId: string;
    data: BodyType<DriverAssignment>;
}, TContext>;
export type AssignDriverToTaskMutationResult = NonNullable<Awaited<ReturnType<typeof assignDriverToTask>>>;
export type AssignDriverToTaskMutationBody = BodyType<DriverAssignment>;
export type AssignDriverToTaskMutationError = ErrorType<unknown>;
/**
* @summary Assign an owned driver to an NGO task
*/
export declare const useAssignDriverToTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof assignDriverToTask>>, TError, {
        taskId: string;
        data: BodyType<DriverAssignment>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof assignDriverToTask>>, TError, {
    taskId: string;
    data: BodyType<DriverAssignment>;
}, TContext>;
export declare const getInviteIndependentDriverUrl: (taskId: string) => string;
/**
 * @summary Invite an independent driver to an NGO task
 */
export declare const inviteIndependentDriver: (taskId: string, driverInviteInput: DriverInviteInput, options?: RequestInit) => Promise<DriverInvitation>;
export declare const getInviteIndependentDriverMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof inviteIndependentDriver>>, TError, {
        taskId: string;
        data: BodyType<DriverInviteInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof inviteIndependentDriver>>, TError, {
    taskId: string;
    data: BodyType<DriverInviteInput>;
}, TContext>;
export type InviteIndependentDriverMutationResult = NonNullable<Awaited<ReturnType<typeof inviteIndependentDriver>>>;
export type InviteIndependentDriverMutationBody = BodyType<DriverInviteInput>;
export type InviteIndependentDriverMutationError = ErrorType<unknown>;
/**
* @summary Invite an independent driver to an NGO task
*/
export declare const useInviteIndependentDriver: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof inviteIndependentDriver>>, TError, {
        taskId: string;
        data: BodyType<DriverInviteInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof inviteIndependentDriver>>, TError, {
    taskId: string;
    data: BodyType<DriverInviteInput>;
}, TContext>;
export declare const getListProviderOrdersUrl: (params?: ListProviderOrdersParams) => string;
/**
 * @summary List citizen per-delivery orders (commercial mode)
 */
export declare const listProviderOrders: (params?: ListProviderOrdersParams, options?: RequestInit) => Promise<DeliveryOrder[]>;
export declare const getListProviderOrdersQueryKey: (params?: ListProviderOrdersParams) => readonly ["/api/providers/me/orders", ...ListProviderOrdersParams[]];
export declare const getListProviderOrdersQueryOptions: <TData = Awaited<ReturnType<typeof listProviderOrders>>, TError = ErrorType<unknown>>(params?: ListProviderOrdersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProviderOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProviderOrders>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProviderOrdersQueryResult = NonNullable<Awaited<ReturnType<typeof listProviderOrders>>>;
export type ListProviderOrdersQueryError = ErrorType<unknown>;
/**
 * @summary List citizen per-delivery orders (commercial mode)
 */
export declare function useListProviderOrders<TData = Awaited<ReturnType<typeof listProviderOrders>>, TError = ErrorType<unknown>>(params?: ListProviderOrdersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProviderOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDispatchOrderDriverUrl: (orderId: string) => string;
/**
 * @summary Assign a driver to a citizen order
 */
export declare const dispatchOrderDriver: (orderId: string, driverAssignment: DriverAssignment, options?: RequestInit) => Promise<DeliveryOrder>;
export declare const getDispatchOrderDriverMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof dispatchOrderDriver>>, TError, {
        orderId: string;
        data: BodyType<DriverAssignment>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof dispatchOrderDriver>>, TError, {
    orderId: string;
    data: BodyType<DriverAssignment>;
}, TContext>;
export type DispatchOrderDriverMutationResult = NonNullable<Awaited<ReturnType<typeof dispatchOrderDriver>>>;
export type DispatchOrderDriverMutationBody = BodyType<DriverAssignment>;
export type DispatchOrderDriverMutationError = ErrorType<unknown>;
/**
* @summary Assign a driver to a citizen order
*/
export declare const useDispatchOrderDriver: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof dispatchOrderDriver>>, TError, {
        orderId: string;
        data: BodyType<DriverAssignment>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof dispatchOrderDriver>>, TError, {
    orderId: string;
    data: BodyType<DriverAssignment>;
}, TContext>;
export declare const getListProviderSubscriptionsUrl: () => string;
/**
 * @summary List active citizen subscriptions (commercial mode)
 */
export declare const listProviderSubscriptions: (options?: RequestInit) => Promise<Subscription[]>;
export declare const getListProviderSubscriptionsQueryKey: () => readonly ["/api/providers/me/subscriptions"];
export declare const getListProviderSubscriptionsQueryOptions: <TData = Awaited<ReturnType<typeof listProviderSubscriptions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProviderSubscriptions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProviderSubscriptions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProviderSubscriptionsQueryResult = NonNullable<Awaited<ReturnType<typeof listProviderSubscriptions>>>;
export type ListProviderSubscriptionsQueryError = ErrorType<unknown>;
/**
 * @summary List active citizen subscriptions (commercial mode)
 */
export declare function useListProviderSubscriptions<TData = Awaited<ReturnType<typeof listProviderSubscriptions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProviderSubscriptions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListProviderDriversUrl: (params?: ListProviderDriversParams) => string;
/**
 * @summary List owned drivers for this provider
 */
export declare const listProviderDrivers: (params?: ListProviderDriversParams, options?: RequestInit) => Promise<DriverSummary[]>;
export declare const getListProviderDriversQueryKey: (params?: ListProviderDriversParams) => readonly ["/api/providers/me/drivers", ...ListProviderDriversParams[]];
export declare const getListProviderDriversQueryOptions: <TData = Awaited<ReturnType<typeof listProviderDrivers>>, TError = ErrorType<unknown>>(params?: ListProviderDriversParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProviderDrivers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProviderDrivers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProviderDriversQueryResult = NonNullable<Awaited<ReturnType<typeof listProviderDrivers>>>;
export type ListProviderDriversQueryError = ErrorType<unknown>;
/**
 * @summary List owned drivers for this provider
 */
export declare function useListProviderDrivers<TData = Awaited<ReturnType<typeof listProviderDrivers>>, TError = ErrorType<unknown>>(params?: ListProviderDriversParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProviderDrivers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getApproveOwnedDriverUrl: (driverId: string) => string;
/**
 * @summary Approve a driver onboarding application
 */
export declare const approveOwnedDriver: (driverId: string, options?: RequestInit) => Promise<DriverSummary>;
export declare const getApproveOwnedDriverMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approveOwnedDriver>>, TError, {
        driverId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof approveOwnedDriver>>, TError, {
    driverId: string;
}, TContext>;
export type ApproveOwnedDriverMutationResult = NonNullable<Awaited<ReturnType<typeof approveOwnedDriver>>>;
export type ApproveOwnedDriverMutationError = ErrorType<unknown>;
/**
* @summary Approve a driver onboarding application
*/
export declare const useApproveOwnedDriver: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approveOwnedDriver>>, TError, {
        driverId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof approveOwnedDriver>>, TError, {
    driverId: string;
}, TContext>;
export declare const getRejectOwnedDriverUrl: (driverId: string) => string;
/**
 * @summary Reject a driver onboarding application
 */
export declare const rejectOwnedDriver: (driverId: string, rejectionNote: RejectionNote, options?: RequestInit) => Promise<DriverSummary>;
export declare const getRejectOwnedDriverMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectOwnedDriver>>, TError, {
        driverId: string;
        data: BodyType<RejectionNote>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof rejectOwnedDriver>>, TError, {
    driverId: string;
    data: BodyType<RejectionNote>;
}, TContext>;
export type RejectOwnedDriverMutationResult = NonNullable<Awaited<ReturnType<typeof rejectOwnedDriver>>>;
export type RejectOwnedDriverMutationBody = BodyType<RejectionNote>;
export type RejectOwnedDriverMutationError = ErrorType<unknown>;
/**
* @summary Reject a driver onboarding application
*/
export declare const useRejectOwnedDriver: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectOwnedDriver>>, TError, {
        driverId: string;
        data: BodyType<RejectionNote>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof rejectOwnedDriver>>, TError, {
    driverId: string;
    data: BodyType<RejectionNote>;
}, TContext>;
export declare const getGetProviderMapDataUrl: () => string;
/**
 * @summary Live operations map — driver GPS positions and zone priority polygons
 */
export declare const getProviderMapData: (options?: RequestInit) => Promise<ProviderMapData>;
export declare const getGetProviderMapDataQueryKey: () => readonly ["/api/providers/me/map"];
export declare const getGetProviderMapDataQueryOptions: <TData = Awaited<ReturnType<typeof getProviderMapData>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProviderMapData>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProviderMapData>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProviderMapDataQueryResult = NonNullable<Awaited<ReturnType<typeof getProviderMapData>>>;
export type GetProviderMapDataQueryError = ErrorType<unknown>;
/**
 * @summary Live operations map — driver GPS positions and zone priority polygons
 */
export declare function useGetProviderMapData<TData = Awaited<ReturnType<typeof getProviderMapData>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProviderMapData>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getApplyAsDriverUrl: () => string;
/**
 * @summary Apply to become an owned driver under a provider
 */
export declare const applyAsDriver: (driverInput: DriverInput, options?: RequestInit) => Promise<Driver>;
export declare const getApplyAsDriverMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof applyAsDriver>>, TError, {
        data: BodyType<DriverInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof applyAsDriver>>, TError, {
    data: BodyType<DriverInput>;
}, TContext>;
export type ApplyAsDriverMutationResult = NonNullable<Awaited<ReturnType<typeof applyAsDriver>>>;
export type ApplyAsDriverMutationBody = BodyType<DriverInput>;
export type ApplyAsDriverMutationError = ErrorType<unknown>;
/**
* @summary Apply to become an owned driver under a provider
*/
export declare const useApplyAsDriver: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof applyAsDriver>>, TError, {
        data: BodyType<DriverInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof applyAsDriver>>, TError, {
    data: BodyType<DriverInput>;
}, TContext>;
export declare const getGetMyDriverUrl: () => string;
/**
 * @summary Get current driver profile
 */
export declare const getMyDriver: (options?: RequestInit) => Promise<Driver>;
export declare const getGetMyDriverQueryKey: () => readonly ["/api/drivers/me"];
export declare const getGetMyDriverQueryOptions: <TData = Awaited<ReturnType<typeof getMyDriver>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyDriver>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyDriver>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyDriverQueryResult = NonNullable<Awaited<ReturnType<typeof getMyDriver>>>;
export type GetMyDriverQueryError = ErrorType<unknown>;
/**
 * @summary Get current driver profile
 */
export declare function useGetMyDriver<TData = Awaited<ReturnType<typeof getMyDriver>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyDriver>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetDriverDashboardUrl: () => string;
/**
 * @summary Driver performance summary — tasks completed, on-time rate, active task
 */
export declare const getDriverDashboard: (options?: RequestInit) => Promise<DriverDashboard>;
export declare const getGetDriverDashboardQueryKey: () => readonly ["/api/drivers/me/dashboard"];
export declare const getGetDriverDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getDriverDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDriverDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDriverDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getDriverDashboard>>>;
export type GetDriverDashboardQueryError = ErrorType<unknown>;
/**
 * @summary Driver performance summary — tasks completed, on-time rate, active task
 */
export declare function useGetDriverDashboard<TData = Awaited<ReturnType<typeof getDriverDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListDriverTasksUrl: (params?: ListDriverTasksParams) => string;
/**
 * @summary List driver tasks (assignments and invitations)
 */
export declare const listDriverTasks: (params?: ListDriverTasksParams, options?: RequestInit) => Promise<DriverTask[]>;
export declare const getListDriverTasksQueryKey: (params?: ListDriverTasksParams) => readonly ["/api/drivers/me/tasks", ...ListDriverTasksParams[]];
export declare const getListDriverTasksQueryOptions: <TData = Awaited<ReturnType<typeof listDriverTasks>>, TError = ErrorType<unknown>>(params?: ListDriverTasksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDriverTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listDriverTasks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListDriverTasksQueryResult = NonNullable<Awaited<ReturnType<typeof listDriverTasks>>>;
export type ListDriverTasksQueryError = ErrorType<unknown>;
/**
 * @summary List driver tasks (assignments and invitations)
 */
export declare function useListDriverTasks<TData = Awaited<ReturnType<typeof listDriverTasks>>, TError = ErrorType<unknown>>(params?: ListDriverTasksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDriverTasks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAcceptDriverTaskUrl: (taskId: string) => string;
/**
 * @summary Accept a task invitation
 */
export declare const acceptDriverTask: (taskId: string, options?: RequestInit) => Promise<DriverTask>;
export declare const getAcceptDriverTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof acceptDriverTask>>, TError, {
        taskId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof acceptDriverTask>>, TError, {
    taskId: string;
}, TContext>;
export type AcceptDriverTaskMutationResult = NonNullable<Awaited<ReturnType<typeof acceptDriverTask>>>;
export type AcceptDriverTaskMutationError = ErrorType<unknown>;
/**
* @summary Accept a task invitation
*/
export declare const useAcceptDriverTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof acceptDriverTask>>, TError, {
        taskId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof acceptDriverTask>>, TError, {
    taskId: string;
}, TContext>;
export declare const getRejectDriverTaskUrl: (taskId: string) => string;
/**
 * @summary Reject a task invitation
 */
export declare const rejectDriverTask: (taskId: string, options?: RequestInit) => Promise<DriverTask>;
export declare const getRejectDriverTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectDriverTask>>, TError, {
        taskId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof rejectDriverTask>>, TError, {
    taskId: string;
}, TContext>;
export type RejectDriverTaskMutationResult = NonNullable<Awaited<ReturnType<typeof rejectDriverTask>>>;
export type RejectDriverTaskMutationError = ErrorType<unknown>;
/**
* @summary Reject a task invitation
*/
export declare const useRejectDriverTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectDriverTask>>, TError, {
        taskId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof rejectDriverTask>>, TError, {
    taskId: string;
}, TContext>;
export declare const getStartDriverTaskUrl: (taskId: string) => string;
/**
 * @summary Start a task (transition to in_progress), begin GPS streaming
 */
export declare const startDriverTask: (taskId: string, options?: RequestInit) => Promise<DriverTask>;
export declare const getStartDriverTaskMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof startDriverTask>>, TError, {
        taskId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof startDriverTask>>, TError, {
    taskId: string;
}, TContext>;
export type StartDriverTaskMutationResult = NonNullable<Awaited<ReturnType<typeof startDriverTask>>>;
export type StartDriverTaskMutationError = ErrorType<unknown>;
/**
* @summary Start a task (transition to in_progress), begin GPS streaming
*/
export declare const useStartDriverTask: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof startDriverTask>>, TError, {
        taskId: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof startDriverTask>>, TError, {
    taskId: string;
}, TContext>;
export declare const getSubmitDeliveryProofUrl: (taskId: string) => string;
/**
 * @summary Submit delivery proof (photo + optional signature) to close task
 */
export declare const submitDeliveryProof: (taskId: string, proofInput: ProofInput, options?: RequestInit) => Promise<DeliveryProof>;
export declare const getSubmitDeliveryProofMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitDeliveryProof>>, TError, {
        taskId: string;
        data: BodyType<ProofInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof submitDeliveryProof>>, TError, {
    taskId: string;
    data: BodyType<ProofInput>;
}, TContext>;
export type SubmitDeliveryProofMutationResult = NonNullable<Awaited<ReturnType<typeof submitDeliveryProof>>>;
export type SubmitDeliveryProofMutationBody = BodyType<ProofInput>;
export type SubmitDeliveryProofMutationError = ErrorType<unknown>;
/**
* @summary Submit delivery proof (photo + optional signature) to close task
*/
export declare const useSubmitDeliveryProof: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitDeliveryProof>>, TError, {
        taskId: string;
        data: BodyType<ProofInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof submitDeliveryProof>>, TError, {
    taskId: string;
    data: BodyType<ProofInput>;
}, TContext>;
export declare const getUpdateDriverGpsUrl: () => string;
/**
 * @summary Send GPS position update for active task
 */
export declare const updateDriverGps: (gpsPosition: GpsPosition, options?: RequestInit) => Promise<GpsPosition>;
export declare const getUpdateDriverGpsMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDriverGps>>, TError, {
        data: BodyType<GpsPosition>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateDriverGps>>, TError, {
    data: BodyType<GpsPosition>;
}, TContext>;
export type UpdateDriverGpsMutationResult = NonNullable<Awaited<ReturnType<typeof updateDriverGps>>>;
export type UpdateDriverGpsMutationBody = BodyType<GpsPosition>;
export type UpdateDriverGpsMutationError = ErrorType<unknown>;
/**
* @summary Send GPS position update for active task
*/
export declare const useUpdateDriverGps: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDriverGps>>, TError, {
        data: BodyType<GpsPosition>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateDriverGps>>, TError, {
    data: BodyType<GpsPosition>;
}, TContext>;
export declare const getRegisterCitizenUrl: () => string;
/**
 * @summary Register as a citizen (provide zone location)
 */
export declare const registerCitizen: (citizenInput: CitizenInput, options?: RequestInit) => Promise<Citizen>;
export declare const getRegisterCitizenMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof registerCitizen>>, TError, {
        data: BodyType<CitizenInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof registerCitizen>>, TError, {
    data: BodyType<CitizenInput>;
}, TContext>;
export type RegisterCitizenMutationResult = NonNullable<Awaited<ReturnType<typeof registerCitizen>>>;
export type RegisterCitizenMutationBody = BodyType<CitizenInput>;
export type RegisterCitizenMutationError = ErrorType<unknown>;
/**
* @summary Register as a citizen (provide zone location)
*/
export declare const useRegisterCitizen: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof registerCitizen>>, TError, {
        data: BodyType<CitizenInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof registerCitizen>>, TError, {
    data: BodyType<CitizenInput>;
}, TContext>;
export declare const getGetMyCitizenUrl: () => string;
/**
 * @summary Get current citizen profile
 */
export declare const getMyCitizen: (options?: RequestInit) => Promise<Citizen>;
export declare const getGetMyCitizenQueryKey: () => readonly ["/api/citizens/me"];
export declare const getGetMyCitizenQueryOptions: <TData = Awaited<ReturnType<typeof getMyCitizen>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyCitizen>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyCitizen>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyCitizenQueryResult = NonNullable<Awaited<ReturnType<typeof getMyCitizen>>>;
export type GetMyCitizenQueryError = ErrorType<unknown>;
/**
 * @summary Get current citizen profile
 */
export declare function useGetMyCitizen<TData = Awaited<ReturnType<typeof getMyCitizen>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyCitizen>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetMyCitizenZoneUrl: () => string;
/**
 * @summary Get zone status for current citizen — priority score, last delivery, upcoming schedule
 */
export declare const getMyCitizenZone: (options?: RequestInit) => Promise<CitizenZoneStatus>;
export declare const getGetMyCitizenZoneQueryKey: () => readonly ["/api/citizens/me/zone"];
export declare const getGetMyCitizenZoneQueryOptions: <TData = Awaited<ReturnType<typeof getMyCitizenZone>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyCitizenZone>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyCitizenZone>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyCitizenZoneQueryResult = NonNullable<Awaited<ReturnType<typeof getMyCitizenZone>>>;
export type GetMyCitizenZoneQueryError = ErrorType<unknown>;
/**
 * @summary Get zone status for current citizen — priority score, last delivery, upcoming schedule
 */
export declare function useGetMyCitizenZone<TData = Awaited<ReturnType<typeof getMyCitizenZone>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyCitizenZone>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSendWaterNeedSignalUrl: () => string;
/**
 * @summary Send a one-tap water need signal
 */
export declare const sendWaterNeedSignal: (options?: RequestInit) => Promise<SignalResponse>;
export declare const getSendWaterNeedSignalMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendWaterNeedSignal>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof sendWaterNeedSignal>>, TError, void, TContext>;
export type SendWaterNeedSignalMutationResult = NonNullable<Awaited<ReturnType<typeof sendWaterNeedSignal>>>;
export type SendWaterNeedSignalMutationError = ErrorType<unknown>;
/**
* @summary Send a one-tap water need signal
*/
export declare const useSendWaterNeedSignal: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof sendWaterNeedSignal>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof sendWaterNeedSignal>>, TError, void, TContext>;
export declare const getListCitizenProvidersUrl: () => string;
/**
 * @summary List commercial providers available in the citizen's zone
 */
export declare const listCitizenProviders: (options?: RequestInit) => Promise<ProviderSummary[]>;
export declare const getListCitizenProvidersQueryKey: () => readonly ["/api/citizens/me/providers"];
export declare const getListCitizenProvidersQueryOptions: <TData = Awaited<ReturnType<typeof listCitizenProviders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCitizenProviders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCitizenProviders>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCitizenProvidersQueryResult = NonNullable<Awaited<ReturnType<typeof listCitizenProviders>>>;
export type ListCitizenProvidersQueryError = ErrorType<unknown>;
/**
 * @summary List commercial providers available in the citizen's zone
 */
export declare function useListCitizenProviders<TData = Awaited<ReturnType<typeof listCitizenProviders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCitizenProviders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListCitizenSubscriptionsUrl: () => string;
/**
 * @summary List citizen's active subscriptions
 */
export declare const listCitizenSubscriptions: (options?: RequestInit) => Promise<Subscription[]>;
export declare const getListCitizenSubscriptionsQueryKey: () => readonly ["/api/citizens/me/subscriptions"];
export declare const getListCitizenSubscriptionsQueryOptions: <TData = Awaited<ReturnType<typeof listCitizenSubscriptions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCitizenSubscriptions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCitizenSubscriptions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCitizenSubscriptionsQueryResult = NonNullable<Awaited<ReturnType<typeof listCitizenSubscriptions>>>;
export type ListCitizenSubscriptionsQueryError = ErrorType<unknown>;
/**
 * @summary List citizen's active subscriptions
 */
export declare function useListCitizenSubscriptions<TData = Awaited<ReturnType<typeof listCitizenSubscriptions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCitizenSubscriptions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSubscribeToCitizenProviderUrl: () => string;
/**
 * @summary Subscribe to a commercial provider plan
 */
export declare const subscribeToCitizenProvider: (subscriptionInput: SubscriptionInput, options?: RequestInit) => Promise<Subscription>;
export declare const getSubscribeToCitizenProviderMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof subscribeToCitizenProvider>>, TError, {
        data: BodyType<SubscriptionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof subscribeToCitizenProvider>>, TError, {
    data: BodyType<SubscriptionInput>;
}, TContext>;
export type SubscribeToCitizenProviderMutationResult = NonNullable<Awaited<ReturnType<typeof subscribeToCitizenProvider>>>;
export type SubscribeToCitizenProviderMutationBody = BodyType<SubscriptionInput>;
export type SubscribeToCitizenProviderMutationError = ErrorType<unknown>;
/**
* @summary Subscribe to a commercial provider plan
*/
export declare const useSubscribeToCitizenProvider: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof subscribeToCitizenProvider>>, TError, {
        data: BodyType<SubscriptionInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof subscribeToCitizenProvider>>, TError, {
    data: BodyType<SubscriptionInput>;
}, TContext>;
export declare const getCancelCitizenSubscriptionUrl: (id: string) => string;
/**
 * @summary Cancel a subscription
 */
export declare const cancelCitizenSubscription: (id: string, options?: RequestInit) => Promise<void>;
export declare const getCancelCitizenSubscriptionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cancelCitizenSubscription>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof cancelCitizenSubscription>>, TError, {
    id: string;
}, TContext>;
export type CancelCitizenSubscriptionMutationResult = NonNullable<Awaited<ReturnType<typeof cancelCitizenSubscription>>>;
export type CancelCitizenSubscriptionMutationError = ErrorType<unknown>;
/**
* @summary Cancel a subscription
*/
export declare const useCancelCitizenSubscription: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof cancelCitizenSubscription>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof cancelCitizenSubscription>>, TError, {
    id: string;
}, TContext>;
export declare const getListCitizenOrdersUrl: () => string;
/**
 * @summary List citizen's delivery orders
 */
export declare const listCitizenOrders: (options?: RequestInit) => Promise<DeliveryOrder[]>;
export declare const getListCitizenOrdersQueryKey: () => readonly ["/api/citizens/me/orders"];
export declare const getListCitizenOrdersQueryOptions: <TData = Awaited<ReturnType<typeof listCitizenOrders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCitizenOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCitizenOrders>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCitizenOrdersQueryResult = NonNullable<Awaited<ReturnType<typeof listCitizenOrders>>>;
export type ListCitizenOrdersQueryError = ErrorType<unknown>;
/**
 * @summary List citizen's delivery orders
 */
export declare function useListCitizenOrders<TData = Awaited<ReturnType<typeof listCitizenOrders>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCitizenOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getPlaceDeliveryOrderUrl: () => string;
/**
 * @summary Place a per-delivery order (commercial)
 */
export declare const placeDeliveryOrder: (deliveryOrderInput: DeliveryOrderInput, options?: RequestInit) => Promise<DeliveryOrder>;
export declare const getPlaceDeliveryOrderMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof placeDeliveryOrder>>, TError, {
        data: BodyType<DeliveryOrderInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof placeDeliveryOrder>>, TError, {
    data: BodyType<DeliveryOrderInput>;
}, TContext>;
export type PlaceDeliveryOrderMutationResult = NonNullable<Awaited<ReturnType<typeof placeDeliveryOrder>>>;
export type PlaceDeliveryOrderMutationBody = BodyType<DeliveryOrderInput>;
export type PlaceDeliveryOrderMutationError = ErrorType<unknown>;
/**
* @summary Place a per-delivery order (commercial)
*/
export declare const usePlaceDeliveryOrder: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof placeDeliveryOrder>>, TError, {
        data: BodyType<DeliveryOrderInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof placeDeliveryOrder>>, TError, {
    data: BodyType<DeliveryOrderInput>;
}, TContext>;
export declare const getListCitizenDeliveriesUrl: () => string;
/**
 * @summary Full delivery history (both humanitarian and commercial)
 */
export declare const listCitizenDeliveries: (options?: RequestInit) => Promise<DeliverySummary[]>;
export declare const getListCitizenDeliveriesQueryKey: () => readonly ["/api/citizens/me/deliveries"];
export declare const getListCitizenDeliveriesQueryOptions: <TData = Awaited<ReturnType<typeof listCitizenDeliveries>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCitizenDeliveries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCitizenDeliveries>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCitizenDeliveriesQueryResult = NonNullable<Awaited<ReturnType<typeof listCitizenDeliveries>>>;
export type ListCitizenDeliveriesQueryError = ErrorType<unknown>;
/**
 * @summary Full delivery history (both humanitarian and commercial)
 */
export declare function useListCitizenDeliveries<TData = Awaited<ReturnType<typeof listCitizenDeliveries>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCitizenDeliveries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetCitizenDeliveryUrl: (id: string) => string;
/**
 * @summary Get delivery detail with proof photos
 */
export declare const getCitizenDelivery: (id: string, options?: RequestInit) => Promise<DeliveryDetail>;
export declare const getGetCitizenDeliveryQueryKey: (id: string) => readonly [`/api/citizens/me/deliveries/${string}`];
export declare const getGetCitizenDeliveryQueryOptions: <TData = Awaited<ReturnType<typeof getCitizenDelivery>>, TError = ErrorType<ErrorEnvelope>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCitizenDelivery>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCitizenDelivery>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCitizenDeliveryQueryResult = NonNullable<Awaited<ReturnType<typeof getCitizenDelivery>>>;
export type GetCitizenDeliveryQueryError = ErrorType<ErrorEnvelope>;
/**
 * @summary Get delivery detail with proof photos
 */
export declare function useGetCitizenDelivery<TData = Awaited<ReturnType<typeof getCitizenDelivery>>, TError = ErrorType<ErrorEnvelope>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCitizenDelivery>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetCitizenDriverLocationUrl: (taskId: string) => string;
/**
 * @summary Get live driver GPS position for an active delivery task
 */
export declare const getCitizenDriverLocation: (taskId: string, options?: RequestInit) => Promise<LiveDriverLocation>;
export declare const getGetCitizenDriverLocationQueryKey: (taskId: string) => readonly [`/api/citizens/me/driver-location/${string}`];
export declare const getGetCitizenDriverLocationQueryOptions: <TData = Awaited<ReturnType<typeof getCitizenDriverLocation>>, TError = ErrorType<ErrorEnvelope>>(taskId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCitizenDriverLocation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCitizenDriverLocation>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCitizenDriverLocationQueryResult = NonNullable<Awaited<ReturnType<typeof getCitizenDriverLocation>>>;
export type GetCitizenDriverLocationQueryError = ErrorType<ErrorEnvelope>;
/**
 * @summary Get live driver GPS position for an active delivery task
 */
export declare function useGetCitizenDriverLocation<TData = Awaited<ReturnType<typeof getCitizenDriverLocation>>, TError = ErrorType<ErrorEnvelope>>(taskId: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCitizenDriverLocation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListZonesUrl: () => string;
/**
 * @summary List all zones (admin view)
 */
export declare const listZones: (options?: RequestInit) => Promise<Zone[]>;
export declare const getListZonesQueryKey: () => readonly ["/api/zones"];
export declare const getListZonesQueryOptions: <TData = Awaited<ReturnType<typeof listZones>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listZones>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listZones>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListZonesQueryResult = NonNullable<Awaited<ReturnType<typeof listZones>>>;
export type ListZonesQueryError = ErrorType<unknown>;
/**
 * @summary List all zones (admin view)
 */
export declare function useListZones<TData = Awaited<ReturnType<typeof listZones>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listZones>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetZonePriorityUrl: (id: string) => string;
/**
 * @summary Get computed priority score for a zone
 */
export declare const getZonePriority: (id: string, options?: RequestInit) => Promise<ZonePriorityScore>;
export declare const getGetZonePriorityQueryKey: (id: string) => readonly [`/api/zones/${string}/priority`];
export declare const getGetZonePriorityQueryOptions: <TData = Awaited<ReturnType<typeof getZonePriority>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getZonePriority>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getZonePriority>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetZonePriorityQueryResult = NonNullable<Awaited<ReturnType<typeof getZonePriority>>>;
export type GetZonePriorityQueryError = ErrorType<unknown>;
/**
 * @summary Get computed priority score for a zone
 */
export declare function useGetZonePriority<TData = Awaited<ReturnType<typeof getZonePriority>>, TError = ErrorType<unknown>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getZonePriority>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetZonePriorityHeatmapUrl: () => string;
/**
 * @summary Signal density heatmap — all zones with priority scores
 */
export declare const getZonePriorityHeatmap: (options?: RequestInit) => Promise<ZoneHeatmapEntry[]>;
export declare const getGetZonePriorityHeatmapQueryKey: () => readonly ["/api/zones/priority-heatmap"];
export declare const getGetZonePriorityHeatmapQueryOptions: <TData = Awaited<ReturnType<typeof getZonePriorityHeatmap>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getZonePriorityHeatmap>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getZonePriorityHeatmap>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetZonePriorityHeatmapQueryResult = NonNullable<Awaited<ReturnType<typeof getZonePriorityHeatmap>>>;
export type GetZonePriorityHeatmapQueryError = ErrorType<unknown>;
/**
 * @summary Signal density heatmap — all zones with priority scores
 */
export declare function useGetZonePriorityHeatmap<TData = Awaited<ReturnType<typeof getZonePriorityHeatmap>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getZonePriorityHeatmap>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListNotificationsUrl: (params?: ListNotificationsParams) => string;
/**
 * @summary List notifications for the current user
 */
export declare const listNotifications: (params?: ListNotificationsParams, options?: RequestInit) => Promise<Notification[]>;
export declare const getListNotificationsQueryKey: (params?: ListNotificationsParams) => readonly ["/api/notifications", ...ListNotificationsParams[]];
export declare const getListNotificationsQueryOptions: <TData = Awaited<ReturnType<typeof listNotifications>>, TError = ErrorType<unknown>>(params?: ListNotificationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListNotificationsQueryResult = NonNullable<Awaited<ReturnType<typeof listNotifications>>>;
export type ListNotificationsQueryError = ErrorType<unknown>;
/**
 * @summary List notifications for the current user
 */
export declare function useListNotifications<TData = Awaited<ReturnType<typeof listNotifications>>, TError = ErrorType<unknown>>(params?: ListNotificationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getMarkNotificationReadUrl: (id: string) => string;
/**
 * @summary Mark a notification as read
 */
export declare const markNotificationRead: (id: string, options?: RequestInit) => Promise<Notification>;
export declare const getMarkNotificationReadMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
    id: string;
}, TContext>;
export type MarkNotificationReadMutationResult = NonNullable<Awaited<ReturnType<typeof markNotificationRead>>>;
export type MarkNotificationReadMutationError = ErrorType<unknown>;
/**
* @summary Mark a notification as read
*/
export declare const useMarkNotificationRead: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof markNotificationRead>>, TError, {
    id: string;
}, TContext>;
export declare const getMarkAllNotificationsReadUrl: () => string;
/**
 * @summary Mark all notifications as read
 */
export declare const markAllNotificationsRead: (options?: RequestInit) => Promise<BatchUpdateResult>;
export declare const getMarkAllNotificationsReadMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markAllNotificationsRead>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof markAllNotificationsRead>>, TError, void, TContext>;
export type MarkAllNotificationsReadMutationResult = NonNullable<Awaited<ReturnType<typeof markAllNotificationsRead>>>;
export type MarkAllNotificationsReadMutationError = ErrorType<unknown>;
/**
* @summary Mark all notifications as read
*/
export declare const useMarkAllNotificationsRead: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markAllNotificationsRead>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof markAllNotificationsRead>>, TError, void, TContext>;
export declare const getGetMyPaymentsUrl: () => string;
/**
 * @summary List my payments
 */
export declare const getMyPayments: (options?: RequestInit) => Promise<Payment[]>;
export declare const getGetMyPaymentsQueryKey: () => readonly ["/api/payments/me"];
export declare const getGetMyPaymentsQueryOptions: <TData = Awaited<ReturnType<typeof getMyPayments>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyPayments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyPayments>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyPaymentsQueryResult = NonNullable<Awaited<ReturnType<typeof getMyPayments>>>;
export type GetMyPaymentsQueryError = ErrorType<unknown>;
/**
 * @summary List my payments
 */
export declare function useGetMyPayments<TData = Awaited<ReturnType<typeof getMyPayments>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyPayments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getInitiatePaymentUrl: () => string;
/**
 * @summary Initiate a mock payment (citizen only)
 */
export declare const initiatePayment: (paymentInput: PaymentInput, options?: RequestInit) => Promise<Payment>;
export declare const getInitiatePaymentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof initiatePayment>>, TError, {
        data: BodyType<PaymentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof initiatePayment>>, TError, {
    data: BodyType<PaymentInput>;
}, TContext>;
export type InitiatePaymentMutationResult = NonNullable<Awaited<ReturnType<typeof initiatePayment>>>;
export type InitiatePaymentMutationBody = BodyType<PaymentInput>;
export type InitiatePaymentMutationError = ErrorType<unknown>;
/**
* @summary Initiate a mock payment (citizen only)
*/
export declare const useInitiatePayment: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof initiatePayment>>, TError, {
        data: BodyType<PaymentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof initiatePayment>>, TError, {
    data: BodyType<PaymentInput>;
}, TContext>;
export declare const getGetPaymentUrl: (id: string) => string;
/**
 * @summary Get a single payment by ID
 */
export declare const getPayment: (id: string, options?: RequestInit) => Promise<Payment>;
export declare const getGetPaymentQueryKey: (id: string) => readonly [`/api/payments/${string}`];
export declare const getGetPaymentQueryOptions: <TData = Awaited<ReturnType<typeof getPayment>>, TError = ErrorType<void>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPayment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPayment>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPaymentQueryResult = NonNullable<Awaited<ReturnType<typeof getPayment>>>;
export type GetPaymentQueryError = ErrorType<void>;
/**
 * @summary Get a single payment by ID
 */
export declare function useGetPayment<TData = Awaited<ReturnType<typeof getPayment>>, TError = ErrorType<void>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPayment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getConfirmPaymentUrl: (id: string) => string;
/**
 * @summary Confirm (complete) a pending mock payment
 */
export declare const confirmPayment: (id: string, options?: RequestInit) => Promise<Payment>;
export declare const getConfirmPaymentMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof confirmPayment>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof confirmPayment>>, TError, {
    id: string;
}, TContext>;
export type ConfirmPaymentMutationResult = NonNullable<Awaited<ReturnType<typeof confirmPayment>>>;
export type ConfirmPaymentMutationError = ErrorType<void>;
/**
* @summary Confirm (complete) a pending mock payment
*/
export declare const useConfirmPayment: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof confirmPayment>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof confirmPayment>>, TError, {
    id: string;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map