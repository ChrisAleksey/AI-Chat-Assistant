// Error handling utilities
export const handleAsyncError = (asyncFn) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      console.error('Async error caught:', error);
      throw error;
    }
  };
};

export const safeExecute = (fn, fallback = null) => {
  try {
    return fn();
  } catch (error) {
    console.error('Safe execute error:', error);
    return fallback;
  }
};

export const setupErrorHandlers = () => {
  // Override console.error to provide more context
  const originalError = console.error;
  console.error = (...args) => {
    originalError.apply(console, ['[ERROR]', new Date().toISOString(), ...args]);
  };

  // Override console.warn to provide more context
  const originalWarn = console.warn;
  console.warn = (...args) => {
    originalWarn.apply(console, ['[WARN]', new Date().toISOString(), ...args]);
  };
};