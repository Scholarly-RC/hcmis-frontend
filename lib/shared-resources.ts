export type SharedResourceRecord = {
  id: number;
  uploader_id: string;
  uploader: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
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
