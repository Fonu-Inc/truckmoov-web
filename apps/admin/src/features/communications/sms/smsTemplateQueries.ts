import { queryOptions } from "@tanstack/react-query";
import { getSmsTemplates } from "@truckmoov/api/notification";

export const smsTemplateKeys = { all: ["platform-sms-templates"] as const };

export const smsTemplatesOptions = () => queryOptions({
  queryKey: smsTemplateKeys.all,
  queryFn: getSmsTemplates,
  staleTime: 30_000,
});
