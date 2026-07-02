import { serve } from 'inngest/next';
import { inngest } from '@/inngest.config';
import { scanJob } from '@/lib/inngest/scanJob';

// Inngest webhook endpoint. Next.js 16 app router exports individual methods.
// INNGEST_SIGNING_KEY is read from the environment automatically by the handler.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scanJob],
});
