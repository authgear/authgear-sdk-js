import URL from "core-js-pure/features/url";
/**
 * @internal
 */
export function getURLWithoutQuery(url: string): string {
  const u = new URL(url);
  u.search = "";
  u.hash = "";
  return u.toString();
}
