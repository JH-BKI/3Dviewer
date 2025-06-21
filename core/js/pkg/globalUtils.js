(function () {
    const isDev = true; // Toggle this flag for dev/prod
  
    // custom console.log function
    window.xrslog = isDev
      ? function (...args) {
          const stack = new Error().stack;
          const lines = stack.split('\n');
          
          // Look for the actual caller (skip Error constructor and xrslog function)
          let callerLine = '';
          for (let i = 2; i < lines.length; i++) {
            const line = lines[i];
            // Skip lines that contain our utility functions
            if (!line.includes('xrslog') && !line.includes('globalUtils.js')) {
              callerLine = line;
              break;
            }
          }
          
          // Extract function name and file name
          const funcMatch = callerLine.match(/at\s+(.*?)\s+\(/);
          const fileMatch = callerLine.match(/\((.*?):\d+:\d+\)/);
          
          let funcName = 'anonymous';
          let fileName = 'unknown-file';
          
          if (funcMatch) {
            const fullFuncName = funcMatch[1];
            // Handle different function name formats
            if (fullFuncName.includes('.')) {
              funcName = fullFuncName.split('.').pop();
            } else {
              funcName = fullFuncName;
            }
          }
          
          if (fileMatch) {
            const fullPath = fileMatch[1];
            // Extract just the filename without path and extension
            const pathParts = fullPath.split('/');
            fileName = pathParts[pathParts.length - 1].replace('.js', '');
          }
  
          const prefix = `%c[XRS]%c <${fileName}>%c ${funcName}()%c:`;
          const styles = [
            'color: red; font-weight: bold',
            'color: dodgerblue',
            'color: green',
            'color: inherit'
          ];
  
          console.log(prefix, ...styles, ...args);
        }
      : function () {};
  
    window.xrswarn = function (...args) {
      console.warn('[XRS ⚠️]', ...args);
    };
  
    window.xrserror = function (...args) {
      console.error('[XRS ❌]', ...args);
    };
  



  })();