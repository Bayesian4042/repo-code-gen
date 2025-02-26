import { useState, useEffect, useCallback } from 'react';
import { WebContainer } from '@webcontainer/api';
import { GeneratedFiles } from './types';

interface FileContent {
  file: {
    contents: string;
  };
}

interface DirectoryContent {
  directory: Record<string, never>;
}

type FileSystemContent = FileContent | DirectoryContent;

// Keep track of the global WebContainer instance
let globalWebContainerInstance: WebContainer | null = null;
let isInitializing = false;

export function useWebContainer() {
  const [webcontainerInstance, setWebcontainerInstance] = useState<WebContainer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Initialize WebContainer when the component mounts
  useEffect(() => {
    let mounted = true;

    async function initWebContainer() {
      try {
        // Check if already initializing
        if (isInitializing) {
          console.log('WebContainer initialization already in progress...');
          return;
        }

        // Check if instance already exists
        if (globalWebContainerInstance) {
          console.log('Using existing WebContainer instance');
          if (mounted) {
            setWebcontainerInstance(globalWebContainerInstance);
          }
          return;
        }

        // Start initialization
        isInitializing = true;
        console.log('Initializing WebContainer...');
        if (mounted) {
          setPreviewLoading(true);
        }

        // Create a new WebContainer instance
        const instance = await WebContainer.boot();

        if (mounted) {
          console.log('WebContainer initialized successfully');
          globalWebContainerInstance = instance;
          setWebcontainerInstance(instance);
          setPreviewLoading(false);
        } else {
          // If component unmounted during initialization, cleanup
          instance.teardown();
        }
      } catch (err) {
        console.error('Failed to initialize WebContainer:', err);
        if (mounted) {
          let errorMessage = err instanceof Error ? err.message : 'Unknown error';
          
          // Provide more helpful error messages
          if (errorMessage.includes('storage is not allowed')) {
            errorMessage = 'Storage access error: Please try the following:\n' +
              '1. Disable any content-blocking extensions\n' +
              '2. Open in a new incognito/private window\n' +
              '3. Try a different browser (Chrome recommended)\n' +
              '4. Refresh the page';
          } else if (errorMessage.includes('headers')) {
            errorMessage = 'Security headers missing: Please try:\n' +
              '1. Disable browser extensions\n' +
              '2. Clear browser cache\n' +
              '3. Refresh the page';
          }
          
          setPreviewError(`Failed to initialize WebContainer: ${errorMessage}`);
          setPreviewLoading(false);
        }
      } finally {
        isInitializing = false;
      }
    }

    // Initialize WebContainer
    initWebContainer().catch(console.error);

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);

  // Global cleanup when the window is about to unload
  useEffect(() => {
    const cleanup = () => {
      if (globalWebContainerInstance) {
        console.log('Cleaning up WebContainer...');
        try {
          globalWebContainerInstance.teardown();
        } catch (error) {
          console.error('Error during WebContainer cleanup:', error);
        }
        globalWebContainerInstance = null;
        isInitializing = false;
      }
    };

    window.addEventListener('beforeunload', cleanup);
    return () => window.removeEventListener('beforeunload', cleanup);
  }, []);

  const startPreview = useCallback(async (generatedFiles: GeneratedFiles) => {
    if (!webcontainerInstance || Object.keys(generatedFiles).length === 0) {
      setPreviewError('No files generated or WebContainer not initialized');
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    
    try {
      console.log('Starting preview with files:', Object.keys(generatedFiles));
      
      // Prepare files for WebContainer
      const files: Record<string, FileSystemContent> = {
        // Create root directory structure
        'src': { directory: {} },
        'public': { directory: {} }
      };
      
      // Create directory structure first
      const directories = new Set<string>();
      Object.keys(generatedFiles).forEach(filePath => {
        const parts = filePath.split('/');
        let currentPath = '';
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath += (currentPath ? '/' : '') + parts[i];
          directories.add(currentPath);
        }
      });

      // Add directories
      directories.forEach(dir => {
        files[dir] = {
          directory: {}
        };
      });

      // Add files
      let hasIndexHtml = false;
      let hasJsFiles = false;
      let hasCssFiles = false;

      Object.keys(generatedFiles).forEach(filePath => {
        if (generatedFiles[filePath]?.status === 'completed' && generatedFiles[filePath]?.parsedCode?.code) {
          try {
            // Use the final code, not the streamed version
            const fileContent = generatedFiles[filePath].parsedCode!.code;
            
            // Track file types
            if (filePath === 'index.html') hasIndexHtml = true;
            if (filePath.endsWith('.js')) hasJsFiles = true;
            if (filePath.endsWith('.css')) hasCssFiles = true;
            
            // Handle special files
            if (filePath === 'index.html') {
              files['public/index.html'] = {
                file: {
                  contents: fileContent
                }
              };
            } else if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
              // Convert JSX/TSX files to plain JS for the preview
              const jsPath = filePath.replace(/\.tsx?$/, '.js').replace(/\.jsx$/, '.js');
              files[`src/${jsPath}`] = {
                file: {
                  contents: fileContent
                }
              };
              hasJsFiles = true;
            } else if (filePath.endsWith('.css')) {
              files[`src/${filePath}`] = {
                file: {
                  contents: fileContent
                }
              };
              hasCssFiles = true;
            } else {
              files[`src/${filePath}`] = {
                file: {
                  contents: fileContent
                }
              };
            }
          } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
          }
        }
      });

      console.log('Files structure:', Object.keys(files));

      // Create index.html if it doesn't exist
      if (!hasIndexHtml) {
        const jsScripts = hasJsFiles ? '<script type="module" src="../src/index.js"></script>' : '';
        const cssLinks = hasCssFiles ? '<link rel="stylesheet" href="../src/styles.css">' : '';
        
        files['public/index.html'] = {
          file: {
            contents: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  ${cssLinks}
  ${jsScripts}
</head>
<body>
  <div id="app"></div>
</body>
</html>`
          }
        };
      }
      
      // Create an appropriate package.json
      files['package.json'] = {
        file: {
          contents: JSON.stringify({
            name: 'generated-app',
            version: '1.0.0',
            description: 'Generated by AI',
            type: 'module',
            scripts: {
              start: 'npx serve . -p 3000'
            },
            dependencies: {
              'serve': '^14.0.0'
            }
          }, null, 2)
        }
      };
      
      console.log('Mounting files in WebContainer...');
      await webcontainerInstance.mount(files);
      
      console.log('Installing dependencies...');
      const installProcess = await webcontainerInstance.spawn('npm', ['install']);
      
      // Stream install output for debugging
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          console.log('npm install:', data);
        }
      }));
      
      const installExitCode = await installProcess.exit;
      
      if (installExitCode !== 0) {
        throw new Error(`npm install failed with exit code ${installExitCode}`);
      }
      
      console.log('Starting development server...');
      const serverProcess = await webcontainerInstance.spawn('npm', ['start']);
      
      // Stream server output for debugging
      serverProcess.output.pipeTo(new WritableStream({
        write(data) {
          console.log('npm start:', data);
        }
      }));
      
      // Add server-ready listener
      webcontainerInstance.on('server-ready', (port, url) => {
        console.log('Server ready on:', url);
        setPreviewUrl(url);
        setPreviewLoading(false);
      });
      
    } catch (err) {
      console.error('Failed to start preview:', err);
      setPreviewError(`Failed to start preview server: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setPreviewLoading(false);
    }
  }, [webcontainerInstance]);

  return {
    webcontainerInstance,
    previewUrl,
    previewLoading,
    previewError,
    startPreview,
    isReady: !!webcontainerInstance
  };
}
