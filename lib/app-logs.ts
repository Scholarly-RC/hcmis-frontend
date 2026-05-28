export type AppLogRecord = {
  id: number;
  user_id: string;
  details: string;
  created_at: string;
  updated_at: string;
};

export type AppLogPage = {
  items: AppLogRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};
