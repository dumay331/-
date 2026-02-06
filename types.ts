
export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTI_CHOICE = 'MULTI_CHOICE',
  OPEN_ENDED = 'OPEN_ENDED',
  RATING = 'RATING'
}

export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options?: string[];
}

export interface Questionnaire {
  title: string;
  description: string;
  questions: Question[];
}

export interface SurveyConfig {
  purpose: string;
  targetAudience: string;
  questionCount: number;
}
