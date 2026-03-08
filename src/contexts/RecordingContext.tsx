import { createContext, useContext, useState } from 'react';

interface RecordingContextValue {
  isRecording: boolean;
  setIsRecording: (value: boolean) => void;
}

const RecordingContext = createContext<RecordingContextValue>({
  isRecording: false,
  setIsRecording: () => {},
});

export function RecordingProvider({ children }: { children: React.ReactNode }) {
  const [isRecording, setIsRecording] = useState(false);
  return (
    <RecordingContext.Provider value={{ isRecording, setIsRecording }}>
      {children}
    </RecordingContext.Provider>
  );
}

export const useRecording = () => useContext(RecordingContext);
