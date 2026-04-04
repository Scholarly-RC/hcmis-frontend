export type AnnouncementStatus = "draft" | "published" | "archived";

export type PollStatus = "draft" | "published" | "closed" | "archived";

export type AnnouncementRecord = {
  id: number;
  author_id: string;
  title: string;
  summary: string | null;
  content: string;
  status: AnnouncementStatus;
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PollChoiceRecord = {
  id: number;
  poll_id: number;
  text: string;
  position: number;
  vote_count: number;
};

export type PollRecord = {
  id: number;
  author_id: string;
  question: string;
  description: string | null;
  allow_multiple_choices: boolean;
  status: PollStatus;
  published_at: string | null;
  closed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  choices: PollChoiceRecord[];
  user_vote_choice_ids: number[];
};

export type FeedItemRecord = {
  item_type: "announcement" | "poll";
  announcement: AnnouncementRecord | null;
  poll: PollRecord | null;
};

export type QuestionnaireRecord = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  content: {
    questionnaire_content?: EvaluationDomainRecord[];
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UserEvaluationRecord = {
  id: number;
  evaluatee_id: string;
  questionnaire_id: number;
  quarter: "FQ" | "SQ";
  year: number;
  is_finalized: boolean;
  evaluatee?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  questionnaire?: {
    id: number;
    code: string;
    title: string;
  } | null;
  created_at: string;
  updated_at: string;
};

export type EvaluationQuestionRecord = {
  indicator_number: string | number;
  indicator?: string;
  rating: string | number | null;
};

export type EvaluationDomainRecord = {
  domain_number?: string | number;
  domain_name?: string;
  name?: string;
  questions: EvaluationQuestionRecord[];
};

export type EvaluationRecord = {
  id: number;
  evaluator_id: string;
  user_evaluation_id: number;
  questionnaire_id: number;
  positive_feedback: string | null;
  improvement_suggestion: string | null;
  content_data: EvaluationDomainRecord[];
  date_submitted: string | null;
  evaluator?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  created_at: string;
  updated_at: string;
};

export type UserEvaluationAggregateDomainRecord = {
  domain_key: string;
  self_rating_mean: number;
  peer_rating_mean: number;
};

export type UserEvaluationAggregateRecord = {
  user_evaluation_id: number;
  evaluatee_id: string;
  questionnaire_id: number;
  quarter: "FQ" | "SQ";
  year: number;
  is_finalized: boolean;
  self_rating_overall_mean: number;
  peer_rating_overall_mean: number;
  domains: UserEvaluationAggregateDomainRecord[];
  peer_positive_feedback: string[];
  peer_improvement_suggestions: string[];
};

export type AnnouncementCreatePayload = {
  title: string;
  summary: string | null;
  content: string;
};

export type PollCreatePayload = {
  question: string;
  description: string | null;
  allow_multiple_choices: boolean;
  choices: Array<{ text: string }>;
};

export type PollVotePayload = {
  choice_ids: number[];
};
