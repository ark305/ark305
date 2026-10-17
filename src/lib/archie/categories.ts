// Categorías de servicio de Archie (enum service_category_type). Se usan en el servidor y en el teléfono.
export const SERVICE_CATEGORIES = ["DRIVER", "YACHT", "CHEF", "VIDEOGRAPHER", "PHOTOGRAPHER", "CLEANER", "SECURITY"] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
