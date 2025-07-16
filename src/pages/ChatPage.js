import React, { useState, useEffect, useRef } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import styled from '@emotion/styled';
import Sidebar from '../components/Sidebar';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import Header from '../components/Header';
import AuthButton from '../components/AuthButton';
import LoadingFallback from '../components/LoadingFallback';
import usePuterScript from '../hooks/usePuterScript';

const ChatContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  padding: '20px 0',
  gap: 8,
  marginBottom: '80px',
  height: 'calc(100vh - 180px)',
  [theme.breakpoints.down('sm')]: {
    height: 'calc(100vh - 160px)',
  },
}));

const ChatPage = () => {
  const initialChat = {
    id: uuidv4(),
    title: 'New Chat 1',
    messages: [],
  };

  const [chats, setChats] = useState([initialChat]);
  const [selectedChat, setSelectedChat] = useState(initialChat);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('model1');
  const [enterKeyBehavior, setEnterKeyBehavior] = useState('send');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPuterReady, setIsPuterReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const messagesEndRef = useRef(null);
  
  // Use the custom hook for Puter script loading
  usePuterScript();

  // Initialize proxy handler for API calls
  useEffect(() => {
    let intervalId;
    
    const startProxyHandler = () => {
      console.log('Starting Puter proxy handler...');
      
      // Poll for pending requests every 1 second
      intervalId = setInterval(async () => {
        try {
          if (!isPuterReady || !isAuthenticated || !window.puter || !window.puter.ai) {
            return;
          }
          
          // Check for pending requests
          const response = await fetch('/api/puter-proxy/pending');
          const data = await response.json();
          
          if (data.requests && data.requests.length > 0) {
            console.log(`Found ${data.requests.length} pending requests`);
            
            // Process each request
            for (const request of data.requests) {
              await handlePuterRequest(request);
            }
          }
        } catch (error) {
          console.error('Error checking pending requests:', error);
        }
      }, 1000);
    };

    const handlePuterRequest = async (request) => {
      try {
        const { id, input, options } = request;
        
        console.log(`Handling Puter request ${id}:`, { input, options });
        
        // Convert input format for Puter
        let puterInput;
        if (Array.isArray(input)) {
          // Extract text from Cline's complex format
          puterInput = input.map(item => {
            if (item.type === 'text') {
              return item.text;
            }
            return '';
          }).join('\n\n');
        } else if (typeof input === 'string') {
          puterInput = input;
        } else {
          puterInput = JSON.stringify(input);
        }
        
        console.log(`Converted input for Puter:`, puterInput.substring(0, 200) + '...');
        
        // Make the real Puter AI call with proper streaming
        const responseStream = await window.puter.ai.chat(puterInput, options);
        
        let fullResponse = '';
        const chunks = [];
        
        // Collect the stream from Puter
        for await (const part of responseStream) {
          const text = part?.text || '';
          fullResponse += text;
          chunks.push({ text });
        }
        
        const responseData = {
          success: true,
          isStream: options.stream,
          chunks: options.stream ? chunks : undefined,
          response: fullResponse,
          fullResponse
        };
        
        console.log(`Sending response for request ${id}:`, responseData.fullResponse?.substring(0, 100) + '...');
        
        // Send the complete response
        await fetch(`/api/puter-proxy/response/${id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(responseData)
        });
        
      } catch (error) {
        console.error(`Error handling request ${request.id}:`, error);
        
        // Send error response
        await fetch(`/api/puter-proxy/response/${request.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            success: false,
            error: error.message
          })
        });
      }
    };

    if (isPuterReady && isAuthenticated) {
      startProxyHandler();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPuterReady, isAuthenticated]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  // Check for Puter availability
  useEffect(() => {
    let checkCount = 0;
    const maxChecks = 100; // 10 seconds total (100ms * 100)
    
    const checkPuter = setInterval(() => {
      checkCount++;
      
      if (window.puter) {
        console.log('Puter is ready');
        setIsPuterReady(true);
        setIsLoading(false);
        clearInterval(checkPuter);
      } else if (checkCount >= maxChecks) {
        console.warn('Puter failed to load within timeout period');
        setIsLoading(false); // Stop loading even if Puter didn't load
        clearInterval(checkPuter);
      }
    }, 100);

    // Cleanup interval on unmount
    return () => {
      clearInterval(checkPuter);
    };
  }, []);

  const handleNewChat = () => {
    const newChat = {
      id: uuidv4(),
      title: `New Chat ${chats.length + 1}`,
      messages: [],
    };
    setChats([...chats, newChat]);
    setSelectedChat(newChat);
  };

  const handleRenameChat = (chatId, newTitle) => {
    setChats(
      chats.map((chat) =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      )
    );
  };

  const handleDeleteChat = (chatId) => {
    setChats(chats.filter((chat) => chat.id !== chatId));
    if (selectedChat?.id === chatId) {
      setSelectedChat(chats[0] || null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedChat) return;

    // Check if Puter is ready and available
    if (!isPuterReady || !window.puter) {
      console.error('Puter is not ready or available');
      return;
    }

    const userMessage = { id: uuidv4(), role: 'user', content: input };
    const aiMessage = { id: uuidv4(), role: 'ai', content: '' };
    
    const updatedChat = {
      ...selectedChat,
      messages: [...selectedChat.messages, userMessage, aiMessage],
    };
    
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === selectedChat.id ? updatedChat : chat
      )
    );
    setSelectedChat(updatedChat);
    setInput('');
    setLoading(true);

    const options = {
      stream: true,
      model: model === 'model1' ? 'claude-sonnet-4' : undefined,
    };

    try {
      // Check if user is authenticated through our simulation
      if (!isAuthenticated) {
        throw new Error('Please sign in first using the Sign In button above.');
      }

      const responseStream = await window.puter.ai.chat(input, options);
      let fullResponse = '';

      for await (const part of responseStream) {
        fullResponse += part?.text || '';
        
        // Use functional updates to avoid closure issues
        const currentResponse = fullResponse;
        const currentAiMessageId = aiMessage.id;
        const currentSelectedChatId = selectedChat.id;
        
        setSelectedChat(prevChat => {
          const newMessages = [...prevChat.messages];
          const aiMsgIndex = newMessages.findIndex(msg => msg.id === currentAiMessageId);
          if (aiMsgIndex !== -1) {
            newMessages[aiMsgIndex] = { ...newMessages[aiMsgIndex], content: currentResponse };
          }
          return { ...prevChat, messages: newMessages };
        });
        
        setChats(prevChats =>
          prevChats.map(chat =>
            chat.id === currentSelectedChatId
              ? { 
                  ...chat, 
                  messages: chat.messages.map(msg => 
                    msg.id === currentAiMessageId 
                      ? { ...msg, content: currentResponse }
                      : msg
                  )
                }
              : chat
          )
        );
      }
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Error: Unable to fetch response.';
      
      // Provide more specific error messages
      if (error.message.includes('Authentication')) {
        errorMessage = 'Error: Authentication required. Please sign in to Puter first.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Error: Unauthorized. Please check your Puter authentication.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Error: Network issue. Please check your connection.';
      }
      
      setSelectedChat(prevChat => {
        const newMessages = [...prevChat.messages];
        const aiMsgIndex = newMessages.findIndex(msg => msg.id === aiMessage.id);
        if (aiMsgIndex !== -1) {
          newMessages[aiMsgIndex] = { ...newMessages[aiMsgIndex], content: errorMessage };
        }
        return { ...prevChat, messages: newMessages };
      });
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === selectedChat.id
            ? { ...chat, messages: [...selectedChat.messages.slice(0, -1), { ...aiMessage, content: errorMessage }] }
            : chat
        )
      );
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSimulateAuth = async () => {
    if (!isPuterReady || !window.puter || isAuthenticating) return;

    setIsAuthenticating(true);
    console.log('Simulating authentication with hidden message...');

    const options = {
      stream: true,
      model: model === 'model1' ? 'claude-sonnet-4' : undefined,
    };

    try {
      // Send hidden authentication message
      const authMessage = "Hola, me he autenticado";
      console.log('Sending auth simulation message:', authMessage);
      
      const responseStream = await window.puter.ai.chat(authMessage, options);
      
      // Consume the response but don't show it
      let authResponse = '';
      for await (const part of responseStream) {
        authResponse += part?.text || '';
      }
      
      console.log('Auth simulation successful, response received');
      console.log('Auth response preview:', authResponse.substring(0, 100) + '...');
      
      // Mark as authenticated
      setIsAuthenticated(true);
      
      // Extract and send Puter session token to our API server
      try {
        const puterToken = await extractPuterToken();
        if (puterToken) {
          await sendTokenToServer(puterToken);
          console.log('Puter token sent to API server');
        }
      } catch (tokenError) {
        console.warn('Failed to extract/send Puter token:', tokenError);
      }
      
    } catch (error) {
      console.error('Auth simulation failed:', error);
      // Even if it fails, the popup should have appeared and auth should be established
      // Check if we're now authenticated
      if (window.puter.auth && window.puter.auth.isSignedIn) {
        console.log('Auth established despite error');
        setIsAuthenticated(true);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Extract Puter session token
  const extractPuterToken = async () => {
    try {
      console.log('=== EXTRACTING PUTER TOKEN ===');
      
      // After successful authentication, try to get the actual session info
      if (window.puter && window.puter.auth) {
        console.log('Puter auth object available:', Object.keys(window.puter.auth));
        
        // First, try to get user info to confirm authentication
        try {
          const userInfo = await window.puter.auth.getUser();
          console.log('User authenticated:', userInfo);
          
          // Try to get session token from various sources
          if (window.puter.auth.token) {
            console.log('Found token in puter.auth.token:', window.puter.auth.token);
            return window.puter.auth.token;
          }
          
          if (window.puter.auth.getToken) {
            const token = await window.puter.auth.getToken();
            if (token) {
              console.log('Found token from puter.auth.getToken():', token);
              return token;
            }
          }
          
          // Try to access internal token storage
          if (window.puter.auth._token) {
            console.log('Found token in puter.auth._token:', window.puter.auth._token);
            return window.puter.auth._token;
          }
          
          // Try to get session ID or similar
          if (window.puter.auth.session) {
            console.log('Found session info:', window.puter.auth.session);
            if (typeof window.puter.auth.session === 'object') {
              return JSON.stringify(window.puter.auth.session);
            }
            return window.puter.auth.session;
          }
          
          // Try accessing the whole auth object for debugging
          console.log('Full auth object:', window.puter.auth);
          
        } catch (authError) {
          console.log('Auth check failed:', authError);
        }
      }
      
      // Check for any puter-related items in localStorage/sessionStorage
      console.log('=== CHECKING STORAGE ===');
      
      // Get all storage keys for debugging
      const allLocalKeys = Object.keys(localStorage);
      const allSessionKeys = Object.keys(sessionStorage);
      
      console.log('All localStorage keys:', allLocalKeys);
      console.log('All sessionStorage keys:', allSessionKeys);
      
      // Look for any puter-related keys
      const puterLocalKeys = allLocalKeys.filter(key => key.toLowerCase().includes('puter'));
      const puterSessionKeys = allSessionKeys.filter(key => key.toLowerCase().includes('puter'));
      
      console.log('Puter localStorage keys:', puterLocalKeys);
      console.log('Puter sessionStorage keys:', puterSessionKeys);
      
      // Try to get the most likely token
      for (const key of puterLocalKeys) {
        const value = localStorage.getItem(key);
        console.log(`localStorage['${key}']:`, value);
        if (value && value.length > 10) { // Tokens are usually longer
          return value;
        }
      }
      
      for (const key of puterSessionKeys) {
        const value = sessionStorage.getItem(key);
        console.log(`sessionStorage['${key}']:`, value);
        if (value && value.length > 10) {
          return value;
        }
      }
      
      // Check cookies more thoroughly
      console.log('=== CHECKING COOKIES ===');
      console.log('All cookies:', document.cookie);
      
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        console.log(`Cookie: ${name} = ${value}`);
        if (name.toLowerCase().includes('puter') && value && value.length > 10) {
          console.log('Found Puter cookie token:', value);
          return value;
        }
      }
      
      // If no real token found, we have a problem
      console.error('=== NO REAL TOKEN FOUND ===');
      console.error('Cannot extract real Puter session token. API calls may fail.');
      
      // Return null instead of generating fake token
      return null;
      
    } catch (error) {
      console.error('Error extracting Puter token:', error);
      return null;
    }
  };

  // Send token to our API server
  const sendTokenToServer = async (token) => {
    try {
      const response = await fetch('http://localhost:3001/v1/auth/puter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send token to server');
      }
      
      const result = await response.json();
      console.log('Token sent to server:', result);
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  };

  // Show loading screen while initializing
  if (isLoading) {
    return <LoadingFallback message="Initializing AI Chat Assistant..." />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#343541',
      }}
    >
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Box sx={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Sidebar
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />
        <ChatContainer>
          <AuthButton 
            isPuterReady={isPuterReady}
            isAuthenticated={isAuthenticated}
            isAuthenticating={isAuthenticating}
            onSignIn={handleSimulateAuth}
          />
          {selectedChat?.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </ChatContainer>
      </Box>
      <ChatInput
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onSend={handleSend}
        disabled={loading || !selectedChat || !isPuterReady || !isAuthenticated}
        placeholder={
          !isPuterReady ? "Loading Puter..." :
          !isAuthenticated ? "Please sign in first to start chatting..." :
          loading ? "AI is thinking..." :
          "Type your message here..."
        }
        model={model}
        onModelChange={(e) => setModel(e.target.value)}
        enterKeyBehavior={enterKeyBehavior}
        onEnterKeyBehaviorChange={(e) => setEnterKeyBehavior(e.target.value)}
      />
    </Box>
  );
};

export default ChatPage;