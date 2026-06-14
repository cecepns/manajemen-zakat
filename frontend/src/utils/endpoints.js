export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    PROFILE: "/auth/profile",
  },
  USERS: {
    LIST: "/users",
    DETAIL: (id) => `/users/${id}`,
    CREATE: "/users",
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
  },
  SETTINGS: {
    LIST: "/settings",
    UPDATE: "/settings",
    LOGO: "/settings/logo",
  },
  TRANSACTIONS: {
    LIST: "/transactions",
    DETAIL: (id) => `/transactions/${id}`,
    CREATE: "/transactions",
    UPDATE: (id) => `/transactions/${id}`,
    DELETE: (id) => `/transactions/${id}`,
    DELETE_ALL: "/transactions/all",
    PRINT: (id) => `/transactions/${id}/print`,
  },
  VERIFY: {
    CODE: (code) => `/verify/${code}`,
  },
  DEPOSITS: {
    LIST: "/deposits",
    BALANCE: "/deposits/balance",
    CREATE: "/deposits",
    DELETE: (id) => `/deposits/${id}`,
  },
  DASHBOARD: {
    AMIL: "/dashboard/amil",
    ADMIN: "/dashboard/admin",
  },
  REPORTS: {
    AMIL: "/reports/amil",
    ADMIN_AMIL: "/reports/admin/amil",
    ADMIN_AMIL_DETAIL: (id) => `/reports/admin/amil/${id}`,
    ADMIN_REKAP: "/reports/admin/rekap",
  },
  AUDIT_LOGS: {
    LIST: "/audit-logs",
  },
  BACKUP: {
    CREATE: "/backup",
  },
  HEALTH: "/health",
};
