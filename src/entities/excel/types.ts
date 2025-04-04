export type ChannelCode = "1001" | "1002" | "1003" | "1004";

export interface ExcelData {
  date: string;
  channelCode: ChannelCode;
  category: string;
  productName: string;
  option: string;
  quantity: number;
  sales: number;
}

export interface FileData {
  fileName: string;
  date: string;
  channelCode: ChannelCode;
  data: Record<string, unknown>[];
}

export type ExcelErrorType =
  | "INVALID_FILE_TYPE"
  | "PARSING_ERROR"
  | "EMPTY_FILE"
  | "UNKNOWN";

export class ExcelError extends Error {
  type: ExcelErrorType;

  constructor(message: string, type: ExcelErrorType = "UNKNOWN") {
    super(message);
    this.type = type;
    this.name = "ExcelError";
  }
}
