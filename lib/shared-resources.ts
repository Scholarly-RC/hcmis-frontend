export type SharedResourceRecord = {
  id: number;
  uploader_id: string;
  resource_name: string;
  description: string | null;
  original_filename: string;
  content_type: string | null;
  size_bytes: number;
  is_confidential: boolean;
  shared_user_ids: string[];
  confidential_access_user_ids: string[];
  created_at: string;
  updated_at: string;
};
