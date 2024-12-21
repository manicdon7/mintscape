interface CustomStorage {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  }
  
  const customStorage: CustomStorage = {
    getItem: (key: string): string | null => {
      return localStorage.getItem(key);
    },
    setItem: (key: string, value: string): void => {
      localStorage.setItem(key, value);
    },
    removeItem: (key: string): void => {
      localStorage.removeItem(key);
    },
  };
  
  export default customStorage;