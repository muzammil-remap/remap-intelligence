import { Inngest } from 'inngest';

// Event payload type map for our app. Inngest v4 infers handler types from
// the events this client knows about.
export type AppEvents = {
  'scan.initiated': {
    data: {
      scanId: string;
      domain: string;
      competitorDomain: string | null;
    };
  };
  'scan.answers-submitted': {
    data: {
      scanId: string;
    };
  };
};

// When INNGEST_DEV is set (local development), force dev mode. Otherwise the
// presence of INNGEST_SIGNING_KEY pushes the SDK into cloud mode, which rejects
// the local dev server's unsigned registration requests with a 400.
const isDev = !!process.env.INNGEST_DEV;

export const inngest = new Inngest({
  id: 'remap-intelligence',
  eventKey: process.env.INNGEST_EVENT_KEY,
  isDev,
});
