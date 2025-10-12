export type Response<T> = {
  id: string;
  success: boolean;
  data: T;
};

export type PaginatedResponse<T> = {
  id: number;
  success: boolean;
  data: {
    count: number;
    data: T[];
    hasNextPage: boolean;
  };
};
