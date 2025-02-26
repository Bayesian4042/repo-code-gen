import { useState } from 'react';
import { FileInfo, GeneratedFiles } from './types';

interface FileExplorerProps {
  files: FileInfo[];
  generatedFiles: GeneratedFiles;
  selectedFile: string | null;
  currentlyGenerating: string | null;
  onFileSelect: (filePath: string, shouldGenerate?: boolean) => void;
}

interface FileItemProps {
  file: FileInfo;
  level: number;
  generatedFiles: GeneratedFiles;
  selectedFile: string | null;
  currentlyGenerating: string | null;
  onFileSelect: (filePath: string, shouldGenerate?: boolean) => void;
}

function FileItem({
  file,
  level,
  generatedFiles,
  selectedFile,
  currentlyGenerating,
  onFileSelect
}: FileItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const fileName = file.file_path.split('/').pop() || '';
  const isFolder = file.type === 'folder';
  const paddingLeft = `${level * 12}px`;

  const toggleExpand = (e: React.MouseEvent) => {
    if (isFolder) {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <>
      <div 
        key={file.file_path}
        className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between ${
          selectedFile === file.file_path ? 'bg-blue-100 border-l-2 border-blue-500' : 'hover:bg-gray-100'
        }`}
        onClick={() => !isFolder && onFileSelect(file.file_path)}
        style={{ paddingLeft }}
      >
        <div className="flex items-center overflow-hidden flex-grow">
          {isFolder ? (
            <svg 
              className={`w-4 h-4 mr-2 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              onClick={toggleExpand}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          <span className="truncate" title={file.description}>{fileName}</span>
        </div>
        {!isFolder && (
          <div>
            {currentlyGenerating === file.file_path ? (
              <span className="text-blue-500 text-xs">•••</span>
            ) : generatedFiles[file.file_path]?.status === 'completed' ? (
              <span className="text-green-500 text-xs">✓</span>
            ) : generatedFiles[file.file_path]?.status === 'error' ? (
              <span className="text-red-500 text-xs">⚠️</span>
            ) : !generatedFiles[file.file_path] ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFileSelect(file.file_path, true);
                }}
                className="text-gray-400 hover:text-gray-600 text-xs p-1 rounded hover:bg-gray-200"
                title="Generate code"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            ) : (
              <span className="w-6"></span>
            )}
          </div>
        )}
      </div>
      {isFolder && isExpanded && file.children && (
        <div>
          {file.children.map((child) => (
            <FileItem
              key={child.file_path}
              file={child}
              level={level + 1}
              generatedFiles={generatedFiles}
              selectedFile={selectedFile}
              currentlyGenerating={currentlyGenerating}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function FileExplorer({
  files,
  generatedFiles,
  selectedFile,
  currentlyGenerating,
  onFileSelect
}: FileExplorerProps) {
  if (files.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm">No files to generate yet</div>
    );
  }

  return (
    <div className="py-2">
      {files.map((file) => (
        <FileItem
          key={file.file_path}
          file={file}
          level={0}
          generatedFiles={generatedFiles}
          selectedFile={selectedFile}
          currentlyGenerating={currentlyGenerating}
          onFileSelect={onFileSelect}
        />
      ))}
    </div>
  );
}
