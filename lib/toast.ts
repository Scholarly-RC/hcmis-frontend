import { toast as sonnerToast } from "sonner";
import { normalizeAlertMessageValue } from "@/lib/alert-message";

function normalizeExternalToastData(
  data: Parameters<typeof sonnerToast>[1],
): Parameters<typeof sonnerToast>[1] {
  if (!data) {
    return data;
  }

  const { description } = data;
  if (description === undefined) {
    return data;
  }

  return {
    ...data,
    description: normalizeAlertMessageValue(description),
  };
}

function normalizePromiseData(
  data: Parameters<typeof sonnerToast.promise>[1],
): Parameters<typeof sonnerToast.promise>[1] {
  if (!data) {
    return data;
  }

  return {
    ...data,
    loading:
      data.loading === undefined
        ? undefined
        : normalizeAlertMessageValue(data.loading),
    success:
      data.success === undefined
        ? undefined
        : normalizeAlertMessageValue(data.success),
    error:
      data.error === undefined
        ? undefined
        : normalizeAlertMessageValue(data.error),
    description:
      data.description === undefined
        ? undefined
        : normalizeAlertMessageValue(data.description),
  };
}

const toast = Object.assign(
  (
    message: Parameters<typeof sonnerToast>[0],
    data?: Parameters<typeof sonnerToast>[1],
  ) =>
    sonnerToast(
      normalizeAlertMessageValue(message),
      normalizeExternalToastData(data),
    ),
  {
    success: (
      message: Parameters<typeof sonnerToast.success>[0],
      data?: Parameters<typeof sonnerToast.success>[1],
    ) =>
      sonnerToast.success(
        normalizeAlertMessageValue(message),
        normalizeExternalToastData(data),
      ),
    info: (
      message: Parameters<typeof sonnerToast.info>[0],
      data?: Parameters<typeof sonnerToast.info>[1],
    ) =>
      sonnerToast.info(
        normalizeAlertMessageValue(message),
        normalizeExternalToastData(data),
      ),
    warning: (
      message: Parameters<typeof sonnerToast.warning>[0],
      data?: Parameters<typeof sonnerToast.warning>[1],
    ) =>
      sonnerToast.warning(
        normalizeAlertMessageValue(message),
        normalizeExternalToastData(data),
      ),
    error: (
      message: Parameters<typeof sonnerToast.error>[0],
      data?: Parameters<typeof sonnerToast.error>[1],
    ) =>
      sonnerToast.error(
        normalizeAlertMessageValue(message),
        normalizeExternalToastData(data),
      ),
    message: (
      message: Parameters<typeof sonnerToast.message>[0],
      data?: Parameters<typeof sonnerToast.message>[1],
    ) =>
      sonnerToast.message(
        normalizeAlertMessageValue(message),
        normalizeExternalToastData(data),
      ),
    loading: (
      message: Parameters<typeof sonnerToast.loading>[0],
      data?: Parameters<typeof sonnerToast.loading>[1],
    ) =>
      sonnerToast.loading(
        normalizeAlertMessageValue(message),
        normalizeExternalToastData(data),
      ),
    promise: (
      promise: Parameters<typeof sonnerToast.promise>[0],
      data?: Parameters<typeof sonnerToast.promise>[1],
    ) => sonnerToast.promise(promise, normalizePromiseData(data)),
    custom: sonnerToast.custom,
    dismiss: sonnerToast.dismiss,
    getHistory: sonnerToast.getHistory,
    getToasts: sonnerToast.getToasts,
  },
) as typeof sonnerToast;

export { toast };
