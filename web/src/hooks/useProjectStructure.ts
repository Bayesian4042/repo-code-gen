import { useEffect, useState } from 'react';
import projectStructure from '../data/project_structure.json';
import { FileInfo } from '../components/chat/types';

interface DirectoryContent {
  files?: { [key: string]: string };
  directories?: { [key: string]: DirectoryContent };
}

interface RepositoryContent extends DirectoryContent {
  files: { [key: string]: string };
}

interface ProjectStructure {
  [key: string]: RepositoryContent;
}

function processDirectory(
  basePath: string,
  structure: DirectoryContent,
  result: FileInfo[] = []
): FileInfo[] {
  // Process files
  if (structure.files) {
    Object.entries(structure.files).forEach(([fileName, content]) => {
      const filePath = basePath ? `${basePath}/${fileName}` : fileName;
      result.push({
        file_path: filePath,
        description: typeof content === 'string' ? content : JSON.stringify(content),
        type: 'file'
      });
    });
  }

  // Process directories
  if (structure.directories) {
    Object.entries(structure.directories).forEach(([dirName, dirContent]) => {
      const dirPath = basePath ? `${basePath}/${dirName}` : dirName;
      const children: FileInfo[] = [];
      
      // Create folder node
      const folderNode: FileInfo = {
        file_path: dirPath,
        description: `Directory: ${dirName}`,
        type: 'folder',
        children
      };
      result.push(folderNode);

      // Recursively process subdirectory
      processDirectory(dirPath, dirContent, children);
    });
  }

  return result;
}

function parseProjectStructure(structure: ProjectStructure): FileInfo[] {
  const result: FileInfo[] = [];
  
  // Process each top-level repository
  Object.entries(structure).forEach(([repoName, repoContent]) => {
    const repoNode: FileInfo = {
      file_path: repoName,
      description: `Repository: ${repoName}`,
      type: 'folder',
      children: []
    };
    result.push(repoNode);
    
    // Process the repository content
    processDirectory(repoName, repoContent, repoNode.children);
  });

  return result;
}

export function useProjectStructure() {
  const [files, setFiles] = useState<FileInfo[]>([]);

  useEffect(() => {
    const fileTree = parseProjectStructure(projectStructure);
    setFiles(fileTree);
  }, []);

  return files;
}
