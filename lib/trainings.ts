export type TrainingStatus = "pending" | "completed";

export type TrainingAttachmentRecord = {
  id: number;
  file_name: string;
  file_size: number;
  content_type: string | null;
  created_at: string;
};

export type TrainingParticipantRecord = {
  id: number;
  user_id: string;
  user_name: string;
  attachments: TrainingAttachmentRecord[];
};

export type TrainingRecord = {
  id: number;
  title: string;
  description: string | null;
  training_date: string;
  status: TrainingStatus;
  created_by_id: string;
  participants: TrainingParticipantRecord[];
  created_at: string;
  updated_at: string;
};

export type TrainingAttachmentCreatePayload = {
  file_name: string;
  file_size: number;
  content_type: string | null;
};

export type TrainingParticipantCreatePayload = {
  user_id: string;
};

export type TrainingCreatePayload = {
  title: string;
  description: string | null;
  training_date: string;
};

export type TrainingParticipantsReplacePayload = {
  participants: TrainingParticipantCreatePayload[];
};

export type TrainingStatusUpdatePayload = {
  status: TrainingStatus;
};
