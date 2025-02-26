export interface BaseRepoStructure {
  [key: string]: {
    files: {
      [filename: string]: string;
    };
    directories: {
      [dirname: string]: BaseRepoStructure;
    };
  };
}

export interface AgentResponse {
  content: string;
  type?: 'base-repo' | 'chat';
  repoStructure?: BaseRepoStructure;
}

export interface ChatRequest {
  message: string;
  user_id: string;
  intent?: string;
  type?: 'base-repo' | 'chat';
}
