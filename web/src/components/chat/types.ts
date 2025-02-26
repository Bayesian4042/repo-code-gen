export interface ChatMessage {
  role: 'assistant' | 'user' | 'tool';
  content: string | null;
  type?: string;
  status?: 'pending' | 'generating' | 'completed' | 'error';
  output?: string;
  tool_call_id?: string;
  name?: string;
  agent_name?: string;
  currentFile?: string;
  generatedFiles?: { [key: string]: string };
  intent?: 'code';
  tool_calls?: {
    id: string;
    type: string;
    function?: {
      name: string;
      arguments: string;
    };
  }[];
}

export interface FileInfo {
  file_path: string;
  description: string;
}

export interface ParsedCode {
  file_name: string;
  file_path: string;
  code: string;
  description?: string;
  streamedCode?: string;
  streamIndex?: number;
}

export interface GeneratedFile {
  parsedCode?: ParsedCode;
  status: 'completed' | 'error';
  error?: string;
}

export interface GeneratedFiles {
  [key: string]: GeneratedFile;
}
