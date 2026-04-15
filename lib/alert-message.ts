export function toSentenceCaseAlertMessage(message: string) {
  const firstLetterIndex = message.search(/[A-Za-z]/);
  if (firstLetterIndex < 0) {
    return message;
  }

  const firstLetter = message[firstLetterIndex];
  return (
    message.slice(0, firstLetterIndex) +
    firstLetter.toUpperCase() +
    message.slice(firstLetterIndex + 1)
  );
}

export function normalizeAlertMessageValue<T>(value: T): T {
  if (typeof value === "string") {
    return toSentenceCaseAlertMessage(value) as T;
  }

  if (typeof value === "function") {
    return ((...args: unknown[]) => {
      const result = (value as (...functionArgs: unknown[]) => unknown)(
        ...args,
      );
      return typeof result === "string"
        ? toSentenceCaseAlertMessage(result)
        : result;
    }) as T;
  }

  return value;
}
