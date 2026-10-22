import { protectedResourceHandler, metadataCorsOptionsRequestHandler } from 'mcp-handler';
import { authServerIssuer, MCP_URL } from '@/lib/mcp/config';

// Tells MCP clients (RFC 9728) which authorization server can issue tokens for /api/mcp.
const handler = protectedResourceHandler({
  authServerUrls: [authServerIssuer()],
  resourceUrl: MCP_URL,
});

const corsHandler = metadataCorsOptionsRequestHandler();

export { handler as GET, corsHandler as OPTIONS };
