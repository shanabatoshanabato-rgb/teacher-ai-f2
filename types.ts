
export type AppTab = 'home' | 'chat' | 'homework' | 'writer' | 'teacher-uae' | 'files' | 'islamic-hub' | 'settings' | 'voice' | 'translator';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string; // Base64 image data
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

export enum WritingToolType {
  GRAMMAR = 'grammar',
  ARABIC_PARSING = 'parsing',
  REWRITE = 'rewrite'
}

export enum HomeworkSubject {
  MATH = 'math',
  PHYSICS = 'physics',
  ARABIC = 'arabic',
  ENGLISH = 'english'
}

export enum FileType {
  PPT = 'ppt',
  DOC = 'doc'
}
