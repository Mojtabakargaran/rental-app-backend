export interface IListCategoriesRequest {
  tenantId: string;
  activeOnly: boolean;
  correlationId: string;
}

export interface ICategoryItem {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  level: number;
  isActive: boolean;
}

export interface IListCategoriesResponse {
  success: boolean;
  categories?: ICategoryItem[];
  error?: string;
  code?: string;
}

export interface ICreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  tenantId: string;
  createdBy: string;
  ipAddress: string;
  userAgent: string;
  correlationId: string;
}

export interface ICreateCategoryResponse {
  success: boolean;
  category?: ICategoryItem;
  error?: string;
  code?: string;
}

export interface IViewCategoriesRequest {
  tenantId: string;
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  hierarchyLevel?: string;
  correlationId: string;
}

export interface ICategoryItemWithDetails {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  parentName: string | null;
  level: number;
  isActive: boolean;
  createdAt: string;
  childrenCount: number;
}

export interface IPaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IViewCategoriesResponse {
  success: boolean;
  categories?: ICategoryItemWithDetails[];
  pagination?: IPaginationInfo;
  error?: string;
  code?: string;
}

export interface IUpdateCategoryRequest {
  categoryId: string;
  tenantId: string;
  userId: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  isActive: boolean;
  correlationId: string;
  clearedFields?: string[];
}

export interface IUpdatedCategoryItem {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  parentName: string | null;
  level: number;
  isActive: boolean;
  updatedAt: string;
}

export interface IUpdateCategoryResponse {
  success: boolean;
  category?: IUpdatedCategoryItem;
  error?: string;
  code?: string;
}

export interface IDeactivateCategoryRequest {
  categoryId: string;
  tenantId: string;
  userId: string;
  reason?: string;
  correlationId: string;
}

export interface IDeactivateCategoryResponse {
  success: boolean;
  category?: {
    id: string;
    name: string;
    isActive: boolean;
    deactivatedAt: string;
  };
  error?: string;
  code?: string;
}

export interface IReactivateCategoryRequest {
  categoryId: string;
  tenantId: string;
  userId: string;
  correlationId: string;
}

export interface IReactivateCategoryResponse {
  success: boolean;
  category?: {
    id: string;
    name: string;
    isActive: boolean;
    reactivatedAt: string;
  };
  error?: string;
  code?: string;
}

export interface IDeleteCategoryRequest {
  categoryId: string;
  tenantId: string;
  userId: string;
  correlationId: string;
}

export interface IDeleteCategoryResponse {
  success: boolean;
  category?: {
    id: string;
    name: string;
    deletedAt: string;
  };
  error?: string;
  code?: string;
}

export interface ICustomAttribute {
  key: string;
  value: string;
  unit: string | null;
}

export interface ICreateEquipmentRequest {
  tenantId: string;
  userId: string;
  name: string;
  categoryId: string;
  description: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  yearOfManufacture: number | null;
  purchasePrice: number | null;
  purchaseDate: string | null;
  status: string;
  customAttributes: ICustomAttribute[] | null;
  correlationId: string;
}

export interface IEquipmentItem {
  id: string;
  tenantId: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  yearOfManufacture: number | null;
  purchasePrice: number | null;
  purchaseDate: string | null;
  status: string;
  customAttributes: ICustomAttribute[] | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateEquipmentResponse {
  success: boolean;
  equipment?: IEquipmentItem;
  error?: string;
  code?: string;
}

export interface IListEquipmentRequest {
  tenantId: string;
  userId: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
  filters: {
    status?: string[];
    categoryId?: string[];
    manufacturer?: string;
    searchQuery?: string;
    purchaseDateFrom?: string;
    purchaseDateTo?: string;
    createdDateFrom?: string;
    createdDateTo?: string;
  };
}

export interface IListEquipmentItem {
  id: string;
  name: string;
  categoryId: string;
  categoryPath: string;
  serialNumber: string | null;
  status: string;
  manufacturer: string | null;
  model: string | null;
  yearOfManufacture: number | null;
  purchasePrice: number | null;
  purchaseDate: string | null;
  description: string | null;
  customAttributes: ICustomAttribute[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface IListEquipmentResponse {
  success: boolean;
  data?: {
    items: IListEquipmentItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  error?: string;
  code?: string;
}

export interface IGetEquipmentDetailsRequest {
  equipmentId: string;
  tenantId: string;
  userId: string;
  correlationId: string;
}

export interface IEquipmentDetailsItem {
  id: string;
  tenantId: string;
  name: string;
  categoryId: string;
  categoryName: string;
  categoryPath: string;
  description: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  yearOfManufacture: number | null;
  purchasePrice: number | null;
  purchaseDate: string | null;
  status: string;
  customAttributes: ICustomAttribute[] | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface IGetEquipmentDetailsResponse {
  success: boolean;
  equipment?: IEquipmentDetailsItem;
  error?: string;
  code?: string;
}

export interface IUpdateEquipmentRequest {
  equipmentId: string;
  tenantId: string;
  userId: string;
  correlationId: string;
  name: string;
  categoryId: string;
  description: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  yearOfManufacture: number | null;
  purchasePrice: number | null;
  purchaseDate: string | null;
  status: string;
  customAttributes: ICustomAttribute[] | null;
  clearedFields?: string[];
}

export interface IUpdateEquipmentResponse {
  success: boolean;
  equipment?: IEquipmentDetailsItem;
  error?: string;
  code?: string;
}

export interface IUpdateEquipmentStatusRequest {
  equipmentId: string;
  tenantId: string;
  userId: string;
  correlationId: string;
  status: string;
  reason?: string | null;
}

export interface IUpdateEquipmentStatusResponse {
  success: boolean;
  data?: {
    equipment: {
      id: string;
      name: string;
      status: string;
      updatedBy: string;
      updatedAt: string;
    };
    statusChanged: boolean;
    oldStatus?: string;
  };
  error?: string;
  code?: string;
}

export interface IArchiveEquipmentRequest {
  equipmentId: string;
  tenantId: string;
  userId: string;
  correlationId: string;
  reason?: string | null;
}

export interface IArchiveEquipmentResponse {
  success: boolean;
  data?: {
    equipment: {
      id: string;
      name: string;
      categoryId: string;
      categoryPath: string;
      status: string;
      deletedAt: string;
      deletedBy: string;
    };
    fullData: {
      description: string | null;
      manufacturer: string | null;
      model: string | null;
      serialNumber: string | null;
      yearOfManufacture: number | null;
      purchasePrice: number | null;
      purchaseDate: string | null;
      customAttributes: ICustomAttribute[] | null;
      createdBy: string;
      createdAt: string;
      updatedBy: string | null;
      updatedAt: string;
    };
  };
  error?: string;
  code?: string;
}

export interface IDeleteEquipmentPermanentlyRequest {
  equipmentId: string;
  tenantId: string;
  userId: string;
  correlationId: string;
}

export interface IDeleteEquipmentPermanentlyResponse {
  success: boolean;
  data?: {
    deletedEquipment: {
      id: string;
      name: string;
      categoryPath: string;
      status: string;
    };
    fullData: {
      categoryId: string;
      description: string | null;
      manufacturer: string | null;
      model: string | null;
      serialNumber: string | null;
      yearOfManufacture: number | null;
      purchasePrice: number | null;
      purchaseDate: string | null;
      customAttributes: ICustomAttribute[] | null;
      createdBy: string;
      createdAt: string;
      updatedBy: string | null;
      updatedAt: string;
      deletedAt: string | null;
      deletedBy: string | null;
    };
  };
  error?: string;
  code?: string;
}
