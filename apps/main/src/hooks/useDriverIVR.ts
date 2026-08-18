import { useState } from "react";

type JobDetails = {
  pickup: string;
  dropoff: string;
  cargo: string;
  amount: number;
  deadline?: string;
};

type IVROptions = {
  driverName?: string;
  jobId?: string;
  language?: string;
};

type IVRResult = {
  success: boolean;
  callId: string;
};

export function useDriverIVR() {
  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const notifyNewJob = async (
    _phone: string,
    _jobDetails: JobDetails,
    _options?: IVROptions,
  ): Promise<IVRResult> => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(
        resolve,
        1000,
      ));
      return {
        success: true, callId: `ivr-${Date.now()}`,
      };
    }
    finally {
      setIsLoading(false);
    }
  };

  const notifyUrgent = async (
    _phone: string,
    _jobDetails: JobDetails,
    _options?: IVROptions,
  ): Promise<IVRResult> => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(
        resolve,
        1000,
      ));
      return {
        success: true, callId: `ivr-urgent-${Date.now()}`,
      };
    }
    finally {
      setIsLoading(false);
    }
  };

  return {
    notifyNewJob, notifyUrgent, isLoading,
  };
}
