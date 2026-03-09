// next-auth route is no longer used - Steam auth is handled by /api/steam/login and /api/steam/callback
export async function GET() {
  return new Response("Not used", { status: 404 });
}
export async function POST() {
  return new Response("Not used", { status: 404 });
}
