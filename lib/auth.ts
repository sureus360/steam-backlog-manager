import { getSession } from "./session";

export async function auth() {
  return getSession();
}
