// Session manager to handle sharing authenticated browser sessions
const puppeteer = require('puppeteer');

class SessionManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> { browser, page, isAuthenticated }
    this.mainBrowser = null;
    this.mainPage = null;
    this.isMainInitialized = false;
  }

  async initializeMainSession() {
    if (this.isMainInitialized) return;

    console.log('Initializing main Puter session...');
    
    this.mainBrowser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    this.mainPage = await this.mainBrowser.newPage();
    
    // Enable console logs from the page
    this.mainPage.on('console', msg => {
      console.log('Browser console:', msg.text());
    });
    
    // Load Puter script
    await this.mainPage.evaluateOnNewDocument(() => {
      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      script.onload = () => console.log('Puter script loaded');
      script.onerror = (err) => console.error('Puter script error:', err);
      document.head.appendChild(script);
    });

    // Navigate to a page that will trigger script loading
    await this.mainPage.goto('https://puter.com', { waitUntil: 'networkidle2' });
    
    // Wait for Puter to be available
    await this.mainPage.waitForFunction(() => window.puter, { timeout: 30000 });
    
    this.isMainInitialized = true;
    console.log('Main Puter session initialized successfully');
  }

  async authenticateSession(sessionId) {
    try {
      await this.initializeMainSession();
      
      console.log(`Attempting to authenticate session: ${sessionId}`);
      
      // Trigger authentication flow
      const authResult = await this.mainPage.evaluate(async () => {
        try {
          // Try to authenticate using Puter's auth system
          // This will open a popup for authentication
          console.log('Attempting Puter authentication...');
          
          // Send a test message to trigger auth popup
          const testResponse = await window.puter.ai.chat('Hello, authenticate me please', {
            stream: false,
            model: 'claude-3-5-sonnet'
          });
          
          let fullResponse = '';
          for await (const part of testResponse) {
            fullResponse += part?.text || '';
          }
          
          console.log('Authentication successful, response:', fullResponse.substring(0, 100));
          
          // Try to get user info
          let userInfo = null;
          if (window.puter.auth && window.puter.auth.getUser) {
            try {
              userInfo = await window.puter.auth.getUser();
            } catch (e) {
              console.log('Could not get user info:', e);
            }
          }
          
          return {
            success: true,
            authenticated: true,
            userInfo,
            response: fullResponse
          };
          
        } catch (error) {
          console.error('Authentication error:', error);
          return {
            success: false,
            error: error.message
          };
        }
      });
      
      if (authResult.success) {
        console.log('Session authenticated successfully');
        return true;
      } else {
        console.error('Authentication failed:', authResult.error);
        return false;
      }
      
    } catch (error) {
      console.error('Session authentication error:', error);
      return false;
    }
  }

  async callPuterAI(sessionId, input, options = {}) {
    try {
      if (!this.isMainInitialized) {
        await this.initializeMainSession();
      }
      
      console.log(`Making Puter AI call for session ${sessionId}:`, input);
      
      const response = await this.mainPage.evaluate(async (input, options) => {
        try {
          const puterOptions = {
            stream: options.stream || false,
            model: options.model || undefined,
          };

          console.log('Making Puter AI call with options:', puterOptions);
          
          const responseStream = await window.puter.ai.chat(input, puterOptions);
          
          if (options.stream) {
            // For streaming, collect all parts
            let fullResponse = '';
            const chunks = [];
            
            for await (const part of responseStream) {
              const text = part?.text || '';
              fullResponse += text;
              chunks.push({ text });
            }
            
            return { isStream: true, chunks, fullResponse };
          } else {
            // For non-streaming, collect full response
            let fullResponse = '';
            for await (const part of responseStream) {
              fullResponse += part?.text || '';
            }
            return { isStream: false, fullResponse };
          }
        } catch (error) {
          console.error('Puter AI call error:', error);
          throw new Error(`Puter AI call failed: ${error.message}`);
        }
      }, input, options);

      console.log('Puter AI response received:', response.fullResponse.substring(0, 100) + '...');
      return response;
      
    } catch (error) {
      console.error('Puter AI call failed:', error);
      throw error;
    }
  }

  async cleanup() {
    if (this.mainBrowser) {
      await this.mainBrowser.close();
      this.mainBrowser = null;
      this.mainPage = null;
      this.isMainInitialized = false;
    }
    
    for (const [sessionId, session] of this.sessions) {
      if (session.browser) {
        await session.browser.close();
      }
    }
    this.sessions.clear();
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Cleanup on process exit
process.on('exit', () => {
  sessionManager.cleanup();
});

process.on('SIGINT', async () => {
  await sessionManager.cleanup();
  process.exit(0);
});

module.exports = sessionManager;