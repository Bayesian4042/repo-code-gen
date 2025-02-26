import { useState, useEffect } from 'react';
import projectStructureData from '@/data/project_structure.json';

interface FileStructure {
  files?: { [key: string]: string };
  directories?: { [key: string]: FileStructure };
}

const projectStructure = projectStructureData as { [key: string]: FileStructure };

const isFileStructure = (obj: unknown): obj is FileStructure => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ('files' in obj || 'directories' in obj) &&
    (
      !('files' in obj) ||
      (typeof obj.files === 'object' && obj.files !== null)
    ) &&
    (
      !('directories' in obj) ||
      (typeof obj.directories === 'object' && obj.directories !== null)
    )
  );
};

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatInput } from './ChatInput';
import { ChatHistory } from './ChatHistory';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { Preview } from './Preview';
import { useCodeGeneration } from './useCodeGeneration';
import { useWebContainer } from './useWebContainer';
import { Button } from '@/components/ui/button';

export function Chat() {
  const {
    error,
    messages,
    filesToGenerate,
    selectedFile,
    generatedFiles,
    isLoading,
    currentlyGenerating,
    handleSubmit,
    generateFile,
    generateAllFiles,
    setSelectedFile
  } = useCodeGeneration();

  const {
    previewUrl,
    previewLoading,
    previewError,
    startPreview,
    isReady: webcontainerReady
  } = useWebContainer();

  const [currentTab, setCurrentTab] = useState('code');
  const [webcontainerStatus, setWebcontainerStatus] = useState<string>('');

  // Monitor WebContainer status
  useEffect(() => {
    if (previewLoading) {
      console.log('WebContainer: Loading preview...');
      setWebcontainerStatus('Initializing preview environment...');
    } else if (previewError) {
      console.log('WebContainer Error:', previewError);
      setWebcontainerStatus(`Error: ${previewError}`);
    } else if (previewUrl) {
      console.log('WebContainer: Preview URL ready:', previewUrl);
      setWebcontainerStatus('Preview ready');
    } else if (webcontainerReady) {
      console.log('WebContainer: Ready to preview');
      setWebcontainerStatus('Ready to preview');
    } else {
      console.log('WebContainer: Initializing...');
      setWebcontainerStatus('Initializing...');
    }
  }, [previewLoading, previewError, previewUrl, webcontainerReady]);

  const handleFileSelect = (filePath: string, shouldGenerate: boolean = false) => {
    // Get the file content from project structure if it exists
    const fileContent = getFileContentFromStructure(filePath);
    
    setSelectedFile(filePath);
    if (shouldGenerate && !generatedFiles[filePath]) {
      generateFile(filePath);
    } else if (fileContent) {
      // If file exists in project structure, add it to generatedFiles
      const newGeneratedFiles = {
        ...generatedFiles,
        [filePath]: {
          status: 'completed',
          parsedCode: {
            streamedCode: fileContent
          }
        }
      };
      // Update the generated files state
      Object.assign(generatedFiles, newGeneratedFiles);
    }
  };

  const getFileContentFromStructure = (filePath: string): string | null => {
    try {
      const parts = filePath.split('/');
      let current: { [key: string]: FileStructure } | FileStructure = projectStructure;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        if (isFileStructure(current)) {
          // If it's a FileStructure, check files and directories
          if (current.files?.[part]) {
            return current.files[part];
          }
          if (current.directories?.[part]) {
            current = current.directories[part];
            continue;
          }
          return null;
        } else {
          // If it's the root object
          if (current[part]) {
            current = current[part];
            continue;
          }
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting file content:', error);
      return null;
    }
  };

  const handleStartPreview = () => {
    if (!webcontainerReady) {
      console.log('WebContainer not ready yet');
      return;
    }
    console.log('Starting preview with files:', Object.keys(generatedFiles));
    startPreview(generatedFiles);
    setCurrentTab('preview');
  };

  const handleRefreshPreview = () => {
    if (!webcontainerReady) {
      console.log('WebContainer not ready yet');
      return;
    }
    console.log('Refreshing preview...');
    startPreview(generatedFiles);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat History & Input Sidebar */}
      <div className="w-1/4 flex flex-col border-r border-gray-200 bg-gray-50">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-100">
          <h3 className="text-lg font-semibold">AI Code Generator</h3>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto">
          <ChatHistory messages={messages} />
        </div>
        
        {/* Input Form */}
        <ChatInput 
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isGenerating={currentlyGenerating !== null}
        />
        {error && <p className="text-red-500 mt-2 text-sm p-4">{error}</p>}
      </div>

      {/* IDE Main Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* IDE Header with actions */}
        <div className="bg-gray-100 border-b border-gray-200 p-2 flex justify-between items-center">
          <div className="text-sm font-medium">Project Files</div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600">{webcontainerStatus}</span>
            <Button 
              onClick={generateAllFiles}
              disabled={isLoading || currentlyGenerating !== null}
              size="sm"
              variant="outline"
            >
              Generate All Files
            </Button>
            {Object.keys(generatedFiles).length > 0 && (
              <Button 
                onClick={handleStartPreview}
                disabled={!webcontainerReady || previewLoading}
                size="sm"
                variant="outline"
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {previewLoading ? 'Starting Preview...' : 'Run Preview'}
              </Button>
            )}
          </div>
        </div>
      
        {/* IDE Content Area */}
        <div className="flex-1 flex min-h-0">
          {/* File Explorer */}
          <div className="w-1/5 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            {filesToGenerate.length > 0 ? (
              <FileExplorer
                files={filesToGenerate}
                generatedFiles={generatedFiles}
                selectedFile={selectedFile}
                currentlyGenerating={currentlyGenerating}
                onFileSelect={handleFileSelect}
              />
            ) : (
              <div className="p-4 text-gray-500 text-sm">Loading project structure...</div>
            )}
          </div>
          
          {/* Code Editor & Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col">
              <div className="border-b border-gray-200 bg-gray-100">
                <TabsList className="bg-transparent">
                  <TabsTrigger value="code" className="data-[state=active]:bg-white">
                    Code Editor
                  </TabsTrigger>
                  <TabsTrigger 
                    value="preview" 
                    className="data-[state=active]:bg-white"
                    disabled={!previewUrl}
                  >
                    Live Preview
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* Code Editor Tab */}
              <TabsContent value="code" className="flex-1 overflow-hidden flex flex-col mt-0 border-none p-0">
                <CodeEditor
                  selectedFile={selectedFile}
                  generatedFiles={generatedFiles}
                  currentlyGenerating={currentlyGenerating}
                  onRegenerateFile={generateFile}
                  isLoading={isLoading}
                />
              </TabsContent>
              
              {/* Preview Tab */}
              <TabsContent value="preview" className="flex-1 overflow-hidden flex flex-col mt-0 border-none p-0">
                <Preview
                  previewUrl={previewUrl}
                  previewLoading={previewLoading}
                  previewError={previewError}
                  onRefresh={handleRefreshPreview}
                  onStartPreview={handleStartPreview}
                  hasGeneratedFiles={Object.keys(generatedFiles).length > 0}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
