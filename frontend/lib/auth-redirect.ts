export function getAuthRedirectPath(search: string): string | null {
  const redirectPath = new URLSearchParams(search).get("redirect");
  if (
    !redirectPath ||
    !redirectPath.startsWith("/") ||
    redirectPath.startsWith("//") ||
    redirectPath.includes("\\") ||
    redirectPath.startsWith("/login") ||
    redirectPath.startsWith("/register")
  ) {
    return null;
  }

  return redirectPath;
}
