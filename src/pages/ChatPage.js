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

      // Prepare messages array for context (based on puterdoc.md line 299 example)
      const messagesForContext = selectedChat.messages
        .filter(msg => msg.role !== 'ai' || msg.content.trim()) // Skip empty AI messages
        .map(msg => ({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.content
        }));
      
      // Add the current user message
      messagesForContext.push({ role: 'user', content: input });
      
      console.log('🔍 Frontend sending messages for context:', messagesForContext);
      
      // Use messages array if multiple messages, otherwise single input
      const puterInput = messagesForContext.length > 1 ? messagesForContext : input;
      
      const responseStream = await window.puter.ai.chat(puterInput, options);
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
      
      // Share Puter session with API
      global.puterSession = window.puter;
      console.log('🔗 Puter session shared with API');
      
    } catch (error) {
      console.error('Auth simulation failed:', error);
      // Even if it fails, the popup should have appeared and auth should be established
      // Check if we're now authenticated
      if (window.puter.auth && window.puter.auth.isSignedIn) {
        console.log('Auth established despite error');
        setIsAuthenticated(true);
        
        // Share Puter session with API
        global.puterSession = window.puter;
        console.log('🔗 Puter session shared with API');
      }
    } finally {
      setIsAuthenticating(false);
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