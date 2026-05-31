import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl, callId, language } = await req.json();
    
    if (!audioUrl) {
      throw new Error('Audio URL is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Transcribing audio for call:', callId);

    // Download the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to fetch audio file');
    }

    const audioBlob = await audioResponse.blob();
    const audioBase64 = await blobToBase64(audioBlob);

    // Use Lovable AI to transcribe the audio
    const transcriptionPrompt = getTranscriptionPrompt(language || 'en');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: transcriptionPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please transcribe this audio recording and provide a quality analysis.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:audio/mp3;base64,${audioBase64}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'transcription_result',
              description: 'Return the transcription and quality analysis of the call',
              parameters: {
                type: 'object',
                properties: {
                  transcription: {
                    type: 'string',
                    description: 'Full transcription of the call',
                  },
                  summary: {
                    type: 'string',
                    description: 'Brief summary of the call content (2-3 sentences)',
                  },
                  qualityScore: {
                    type: 'number',
                    description: 'Quality score from 1-10 based on clarity and professionalism',
                  },
                  sentiment: {
                    type: 'string',
                    enum: ['positive', 'neutral', 'negative'],
                    description: 'Overall sentiment of the call',
                  },
                  keyTopics: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Key topics discussed in the call',
                  },
                  issues: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Any quality issues or concerns identified',
                  },
                  language: {
                    type: 'string',
                    description: 'Language detected in the call',
                  },
                },
                required: ['transcription', 'summary', 'qualityScore', 'sentiment', 'keyTopics'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'transcription_result' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('Failed to transcribe audio');
    }

    const data = await response.json();
    console.log('Transcription response:', data);

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({
        success: true,
        callId,
        ...result,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback if no tool call
    const content = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({
      success: true,
      callId,
      transcription: content,
      summary: 'Transcription completed',
      qualityScore: 7,
      sentiment: 'neutral',
      keyTopics: [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Transcription error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function getTranscriptionPrompt(language: string): string {
  const languageNames: Record<string, string> = {
    'en': 'English',
    'ha': 'Hausa',
    'yo': 'Yoruba',
    'ig': 'Igbo',
    'pcm': 'Nigerian Pidgin',
  };

  const langName = languageNames[language] || 'English';

  return `You are a call quality analyst for FleetPro, a Nigerian logistics platform. 
Your task is to transcribe and analyze customer support calls.

The call may be in ${langName} or mixed with English. Please:
1. Transcribe the conversation accurately, preserving the original language
2. Provide a brief summary of the call
3. Rate the call quality (1-10) based on:
   - Agent professionalism and tone
   - Resolution of customer issues
   - Clarity of communication
   - Adherence to support guidelines
4. Identify the overall sentiment
5. List key topics discussed
6. Note any quality issues or areas for improvement

Be objective and focus on actionable insights for quality assurance.`;
}
