// NOTE: This hook requires expo-av to be installed: npx expo install expo-av
// import { Audio } from 'expo-av';
// Once installed, replace the stub implementation below with the real one.
import { useEffect, useRef, useState } from 'react';

interface UseAudioRecordingResult {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => void;
  uri: string | undefined;
  durationMs: number;
  isRecording: boolean;
  hasPermission: boolean | null;
}

// Stub implementation — replace with real expo-av calls once expo-av is installed
export function useAudioRecording(): UseAudioRecordingResult {
  const [hasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uri, setUri] = useState<string | undefined>(undefined);
  const [durationMs, setDurationMs] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  async function start() {
    // TODO: replace with real Audio implementation once expo-av is installed
    // const { granted } = await Audio.requestPermissionsAsync();
    // if (!granted) return;
    // await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    // const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    // recordingRef.current = recording;

    startTimeRef.current = Date.now();
    setDurationMs(0);
    setIsRecording(true);

    intervalRef.current = setInterval(() => {
      setDurationMs(Date.now() - startTimeRef.current);
    }, 100);
  }

  async function stop() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // TODO: replace with real Audio implementation once expo-av is installed
    // await recordingRef.current?.stopAndUnloadAsync();
    // const fileUri = recordingRef.current?.getURI();
    // setUri(fileUri ?? undefined);

    setUri(undefined);
    setIsRecording(false);
  }

  function reset() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setUri(undefined);
    setDurationMs(0);
    setIsRecording(false);
  }

  return { start, stop, reset, uri, durationMs, isRecording, hasPermission };
}

// Real implementation (ready to drop in once expo-av is installed):
//
// import { Audio } from 'expo-av';
//
// export function useAudioRecording(): UseAudioRecordingResult {
//   const [hasPermission, setHasPermission] = useState<boolean | null>(null);
//   const [isRecording, setIsRecording] = useState(false);
//   const [uri, setUri] = useState<string | undefined>(undefined);
//   const [durationMs, setDurationMs] = useState(0);
//   const recordingRef = useRef<Audio.Recording | null>(null);
//   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const startTimeRef = useRef<number>(0);
//
//   useEffect(() => { return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, []);
//
//   async function start() {
//     const { granted } = await Audio.requestPermissionsAsync();
//     setHasPermission(granted);
//     if (!granted) return;
//     await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
//     const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
//     recordingRef.current = recording;
//     startTimeRef.current = Date.now();
//     setDurationMs(0);
//     setIsRecording(true);
//     intervalRef.current = setInterval(() => { setDurationMs(Date.now() - startTimeRef.current); }, 100);
//   }
//
//   async function stop() {
//     if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
//     if (recordingRef.current) {
//       await recordingRef.current.stopAndUnloadAsync();
//       setUri(recordingRef.current.getURI() ?? undefined);
//       recordingRef.current = null;
//     }
//     setIsRecording(false);
//   }
//
//   function reset() {
//     if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
//     recordingRef.current = null;
//     setUri(undefined);
//     setDurationMs(0);
//     setIsRecording(false);
//   }
//
//   return { start, stop, reset, uri, durationMs, isRecording, hasPermission };
// }
