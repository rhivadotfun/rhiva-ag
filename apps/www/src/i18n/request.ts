import { format } from "util";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = "en";

  return {
    locale,
    messages: (await import(format("../../messages/%s.json", locale))).default,
  };
});
