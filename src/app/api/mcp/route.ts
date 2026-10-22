import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { registerZarkdroidTools } from '@/lib/mcp/tools';
import { verifyMcpToken } from '@/lib/mcp/auth';
import { APP_URL } from '@/lib/mcp/config';

export const maxDuration = 60;

const handler = createMcpHandler(
  (server) => registerZarkdroidTools(server),
  {
    serverInfo: { name: 'zarkdroid', version: '1.0.0' },
    instructions:
      'Zarkdroid is a spaced-repetition flashcard app (like Anki). The user has decks of cards; each card has a front (prompt) and a back (answer). ' +
      'Call list_decks first to get deck ids; never invent ids. Card states: new, learning, review. ' +
      'You can read, create and edit decks and cards and record reviews, but you cannot delete anything. ' +
      'Confirm with the user before creating many cards at once.',
  },
);

const authHandler = withMcpAuth(handler, verifyMcpToken, {
  required: true,
  resourceMetadataPath: '/.well-known/oauth-protected-resource',
  resourceUrl: APP_URL,
});

export { authHandler as GET, authHandler as POST };
