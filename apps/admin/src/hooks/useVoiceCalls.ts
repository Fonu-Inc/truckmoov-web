import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Language = 'en' | 'ha' | 'yo' | 'ig' | 'pcm';

interface CallResult {
  call_id?: string;
  status?: string;
  error?: string;
}

interface RecordingResult {
  recording_url?: string;
  duration?: number;
  status?: string;
}

interface TranscriptionResult {
  success: boolean;
  callId: string;
  transcription: string;
  summary: string;
  qualityScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyTopics: string[];
  issues?: string[];
  language?: string;
}

interface UseVoiceCallsReturn {
  isLoading: boolean;
  isTranscribing: boolean;
  initiateCall: (phoneNumber: string, language?: Language, message?: string, enableRecording?: boolean) => Promise<CallResult | null>;
  getCallStatus: (callId: string) => Promise<CallResult | null>;
  endCall: (callId: string) => Promise<boolean>;
  playIVRPrompt: (callId: string, promptId: string, language?: Language) => Promise<boolean>;
  transferCall: (callId: string, transferTo: string) => Promise<boolean>;
  startRecording: (callId: string) => Promise<boolean>;
  stopRecording: (callId: string) => Promise<boolean>;
  getRecording: (callId: string) => Promise<RecordingResult | null>;
  transcribeCall: (audioUrl: string, callId: string, language?: Language) => Promise<TranscriptionResult | null>;
}

export function useVoiceCalls(): UseVoiceCallsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const initiateCall = useCallback(async (
    phoneNumber: string,
    language: Language = 'en',
    message?: string,
    enableRecording: boolean = true
  ): Promise<CallResult | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fonu-voice', {
        body: {
          action: 'initiate_call',
          phoneNumber,
          language,
          message,
          enableRecording,
        },
      });

      if (error) {
        console.error('Fonu call error:', error);
        toast.error('Failed to initiate call');
        return null;
      }

      toast.success('Call initiated with recording enabled');
      return data;
    } catch (err) {
      console.error('Voice call error:', err);
      toast.error('Failed to connect to voice service');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCallStatus = useCallback(async (callId: string): Promise<CallResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('fonu-voice', {
        body: {
          action: 'get_call_status',
          callId,
        },
      });

      if (error) {
        console.error('Get call status error:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Get call status error:', err);
      return null;
    }
  }, []);

  const endCall = useCallback(async (callId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fonu-voice', {
        body: {
          action: 'end_call',
          callId,
        },
      });

      if (error) {
        console.error('End call error:', error);
        toast.error('Failed to end call');
        return false;
      }

      toast.success('Call ended');
      return data?.success ?? false;
    } catch (err) {
      console.error('End call error:', err);
      toast.error('Failed to end call');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const playIVRPrompt = useCallback(async (
    callId: string,
    promptId: string,
    language: Language = 'en'
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('fonu-voice', {
        body: {
          action: 'play_ivr',
          callId,
          ivrPromptId: promptId,
          language,
        },
      });

      if (error) {
        console.error('Play IVR error:', error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('Play IVR error:', err);
      return false;
    }
  }, []);

  const transferCall = useCallback(async (
    callId: string,
    transferTo: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fonu-voice', {
        body: {
          action: 'transfer_call',
          callId,
          transferTo,
        },
      });

      if (error) {
        console.error('Transfer call error:', error);
        toast.error('Failed to transfer call');
        return false;
      }

      toast.success('Call transferred');
      return !!data;
    } catch (err) {
      console.error('Transfer call error:', err);
      toast.error('Failed to transfer call');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startRecording = useCallback(async (callId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fonu-voice', {
        body: {
          action: 'start_recording',
          callId,
        },
      });

      if (error) {
        console.error('Start recording error:', error);
        toast.error('Failed to start recording');
        return false;
      }

      toast.success('Recording started');
      return !!data;
    } catch (err) {
      console.error('Start recording error:', err);
      toast.error('Failed to start recording');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopRecording = useCallback(async (callId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fonu-voice', {
        body: {
          action: 'stop_recording',
          callId,
        },
      });

      if (error) {
        console.error('Stop recording error:', error);
        toast.error('Failed to stop recording');
        return false;
      }

      toast.success('Recording stopped');
      return !!data;
    } catch (err) {
      console.error('Stop recording error:', err);
      toast.error('Failed to stop recording');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRecording = useCallback(async (callId: string): Promise<RecordingResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('fonu-voice', {
        body: {
          action: 'get_recording',
          callId,
        },
      });

      if (error) {
        console.error('Get recording error:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Get recording error:', err);
      return null;
    }
  }, []);

  const transcribeCall = useCallback(async (
    audioUrl: string,
    callId: string,
    language: Language = 'en'
  ): Promise<TranscriptionResult | null> => {
    setIsTranscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke('transcribe-call', {
        body: {
          audioUrl,
          callId,
          language,
        },
      });

      if (error) {
        console.error('Transcription error:', error);
        if (error.message?.includes('429')) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else if (error.message?.includes('402')) {
          toast.error('Payment required. Please add credits.');
        } else {
          toast.error('Failed to transcribe call');
        }
        return null;
      }

      toast.success('Transcription completed');
      return data;
    } catch (err) {
      console.error('Transcription error:', err);
      toast.error('Failed to transcribe call');
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  return {
    isLoading,
    isTranscribing,
    initiateCall,
    getCallStatus,
    endCall,
    playIVRPrompt,
    transferCall,
    startRecording,
    stopRecording,
    getRecording,
    transcribeCall,
  };
}



