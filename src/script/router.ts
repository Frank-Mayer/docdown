import type { OutputData } from "@editorjs/editorjs";
import type { language } from "./data/local";
import type { pdfOutput } from "./logic/export";
import type { ISaveData } from "./logic/saveAndLoad";

/**
 * module service
 */
export enum service {
  getLocale,
  setLocale,
  getTheme,
  getDocumentData,
  initFromData,
  getSaveData,
  createPdf,
  prepareExport,
  dataChanged,
  setDocumentName,
  getDocumentName,
  forEachSavedDocument,
}

enum paramResult {
  param,
  result,
}

type ParamResult<P, R> = {
  [paramResult.param]: P;
  [paramResult.result]: R;
};

type ServiceMap = {
  [service.setLocale]: ParamResult<language, void>;
  [service.createPdf]: ParamResult<pdfOutput, void>;
  [service.initFromData]: ParamResult<ISaveData, void>;
  [service.setDocumentName]: ParamResult<string, void>;
  [service.forEachSavedDocument]: ParamResult<
    (doc: Partial<ISaveData>) => void,
    void
  >;
};
type ServiceMapNoParam = {
  [service.getLocale]: ParamResult<undefined, language>;
  [service.getTheme]: ParamResult<undefined, string>;
  [service.getDocumentData]: ParamResult<undefined, Promise<OutputData>>;
  [service.getSaveData]: ParamResult<undefined, Promise<Partial<ISaveData>>>;
  [service.prepareExport]: ParamResult<undefined, void>;
  [service.dataChanged]: ParamResult<undefined, void>;
  [service.getDocumentName]: ParamResult<undefined, string>;
};

const messageReceiver = new Map<service, Array<Function>>();
const messageNotifyReceiver = new Map<service, Array<Function>>();

type ListenForMessageOverload = {
  <S extends keyof ServiceMap>(
    service: S,
    callback: (
      param: ServiceMap[S][paramResult.param]
    ) => ServiceMap[S][paramResult.result]
  ): void;

  <
    S extends keyof ServiceMapNoParam,
    P extends ServiceMapNoParam[S][paramResult.param],
    R extends ServiceMapNoParam[S][paramResult.result]
  >(
    service: S,
    callback: (param: P) => R
  ): void;
};

export const listenForMessage: ListenForMessageOverload = ((
  service: any,
  callback: any
) => {
  const s = messageReceiver.get(service);
  if (s) {
    s.push(callback);
  } else {
    messageReceiver.set(service, [callback]);
  }
}) as ListenForMessageOverload;

type NotifyOnMessageOverload = {
  <S extends keyof ServiceMap>(
    service: S,
    callback: (messageResult: ServiceMap[S][paramResult.result]) => void
  ): void;

  <S extends keyof ServiceMapNoParam>(
    service: S,
    callback: (messageResult: ServiceMapNoParam[S][paramResult.result]) => void
  ): void;
};
export const notifyOnMessage: NotifyOnMessageOverload = (
  service: any,
  callback: any
) => {
  const s = messageNotifyReceiver.get(service);
  if (s) {
    s.push(callback);
  } else {
    messageNotifyReceiver.set(service, [callback]);
  }
};

type SendMessageOverload = {
  // ServiceMap[S][paramResult.result] can be any type
  <S extends keyof ServiceMap>(
    service: S,
    onlyFirstAnswer: true,
    message: ServiceMap[S][paramResult.param]
  ): ServiceMap[S][paramResult.result] | undefined;

  // ServiceMap[S][paramResult.result] can be any type
  <S extends keyof ServiceMap>(
    service: S,
    onlyFirstAnswer: false,
    message: ServiceMap[S][paramResult.param]
  ): Array<ServiceMap[S][paramResult.result]>;

  // ServiceMap[S][paramResult.result] is of type undefined
  <S extends keyof ServiceMapNoParam>(service: S):
    | ServiceMapNoParam[S][paramResult.result]
    | undefined;

  // ServiceMap[S][paramResult.result] is of type undefined
  <S extends keyof ServiceMapNoParam>(service: S, onlyFirstAnswer: true):
    | ServiceMapNoParam[S][paramResult.result]
    | undefined;

  // ServiceMap[S][paramResult.result] is of type undefined
  <S extends keyof ServiceMapNoParam>(
    service: S,
    onlyFirstAnswer: false
  ): Array<ServiceMapNoParam[S][paramResult.result]>;
};

export const sendMessage = ((
  service: any,
  onlyFirstAnswer = true,
  message = undefined
) => {
  const s = messageReceiver.get(service);
  if (s && s.length > 0) {
    let value: any = onlyFirstAnswer ? undefined : new Array();
    for (const callback of s) {
      try {
        if (onlyFirstAnswer) {
          if (value === undefined) {
            value = callback(message);
          } else {
            callback(message);
          }
        } else {
          if (Array.isArray(value)) {
            value.push(callback(message));
          } else {
            value = [callback(message)];
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    const s2 = messageNotifyReceiver.get(service);
    if (s2) {
      for (const callback of s2) {
        try {
          if (onlyFirstAnswer) {
            callback(value);
          } else {
            value.forEach(callback);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    return value;
  } else {
    console.warn(new Error(`No listener for service ${service}`));
  }
}) as SendMessageOverload;
