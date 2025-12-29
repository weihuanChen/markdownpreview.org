// Return HTTP 410 for the legacy `/$` path
const goneResponse = new Response('410 Gone', {
  status: 410,
  statusText: 'Gone',
  headers: {
    'content-type': 'text/plain; charset=utf-8'
  }
});

export function GET() {
  return goneResponse;
}

export const HEAD = GET;

