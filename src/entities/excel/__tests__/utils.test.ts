import { describe, it, expect, vi, beforeEach } from "vitest";
import * as XLSX from "xlsx";
import { parseFileName, parseExcelFile, aggregateExcelData } from "../utils";
import type { FileData } from "../types";

vi.mock("xlsx", () => ({
  read: vi.fn(),
  utils: {
    decode_range: vi.fn(),
    sheet_to_json: vi.fn(),
    json_to_sheet: vi.fn(),
    book_new: vi.fn(),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe("parseFileName", () => {
  it("복지_ 파일명에서 날짜와 채널코드를 파싱한다", () => {
    const result = parseFileName("복지_240331.xlsx");
    expect(result).toEqual({ date: "2024/03/31", channelCode: "1003" });
  });

  it("쇼핑_ 파일명에서 날짜와 채널코드를 파싱한다", () => {
    const result = parseFileName("쇼핑_240331.xlsx");
    expect(result).toEqual({ date: "2024/03/31", channelCode: "1004" });
  });

  it("통합주문목록 파일명에서 날짜와 채널코드를 파싱한다", () => {
    const result = parseFileName("통합주문목록.20240331090248.xlsx");
    expect(result).toEqual({ date: "2024/03/31", channelCode: "1001" });
  });

  it("지정일_주문 파일명에서 날짜와 채널코드를 파싱한다", () => {
    const result = parseFileName("지정일_주문.20240331090534.xlsx");
    expect(result).toEqual({ date: "2024/03/31", channelCode: "1001" });
  });

  it("네이버페이_전체주문발주발송관리 파일명에서 날짜와 채널코드를 파싱한다", () => {
    const result = parseFileName(
      "네이버페이_전체주문발주발송관리_20240331_0910.xlsx"
    );
    expect(result).toEqual({ date: "2024/03/31", channelCode: "1002" });
  });

  it("네이버페이_구매확정내역 파일명에서 날짜와 채널코드를 파싱한다", () => {
    const result = parseFileName("네이버페이_구매확정내역_20240331_1154.xlsx");
    expect(result).toEqual({ date: "2024/03/31", channelCode: "1002" });
  });

  it("알 수 없는 파일명에서는 현재 날짜와 기본 채널코드를 반환한다", () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const expected = { date: `${year}/${month}/${day}`, channelCode: "1001" };

    const result = parseFileName("unknown_file.xlsx");
    expect(result).toEqual(expected);
  });
});

describe("parseExcelFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("XLSX 파일이 아닌 경우 에러를 반환한다", async () => {
    const file = new File([], "test.txt", { type: "text/plain" });

    await expect(parseExcelFile(file)).rejects.toThrow();
    await expect(parseExcelFile(file)).rejects.toMatchObject({
      type: "INVALID_FILE_TYPE",
    });
  });

  it("유효한 엑셀 파일을 성공적으로 파싱한다", async () => {
    // FileReader 모의 구현
    const mockFileReaderInstance = {
      onload: null as
        | ((event: { target: { result: ArrayBuffer } }) => void)
        | null,
      onerror: null as ((event: Event) => void) | null,
      readAsArrayBuffer: vi.fn(function (this: {
        onload: ((event: { target: { result: ArrayBuffer } }) => void) | null;
      }) {
        // 비동기 함수 호출 시뮬레이션
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: new ArrayBuffer(8) } });
          }
        }, 0);
      }),
    };

    const mockFileReader = vi.fn(() => mockFileReaderInstance);
    global.FileReader = mockFileReader as unknown as typeof FileReader;

    // XLSX.read 모의 구현
    (XLSX.read as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      SheetNames: ["Sheet1"],
      Sheets: {
        Sheet1: {
          "!ref": "A1:D10",
        },
      },
    });

    // sheet_to_json 모의 구현
    (
      XLSX.utils.sheet_to_json as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue([
      { 상품명: "테스트 상품", 수량: "1", 결제금액: "10000" },
    ]);

    const file = new File([], "test.xlsx");
    const result = await parseExcelFile(file);

    expect(XLSX.read).toHaveBeenCalled();
    expect(XLSX.utils.sheet_to_json).toHaveBeenCalled();

    expect(result).toMatchObject({
      fileName: "test.xlsx",
      data: [{ 상품명: "테스트 상품", 수량: "1", 결제금액: "10000" }],
    });
  });

  it("시트가 없는 경우 에러를 반환한다", async () => {
    // FileReader 모의 구현
    const mockFileReaderInstance = {
      onload: null as
        | ((event: { target: { result: ArrayBuffer } }) => void)
        | null,
      onerror: null as ((event: Event) => void) | null,
      readAsArrayBuffer: vi.fn(function (this: {
        onload: ((event: { target: { result: ArrayBuffer } }) => void) | null;
      }) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: new ArrayBuffer(8) } });
          }
        }, 0);
      }),
    };

    const mockFileReader = vi.fn(() => mockFileReaderInstance);
    global.FileReader = mockFileReader as unknown as typeof FileReader;

    (XLSX.read as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      SheetNames: [],
      Sheets: {},
    });

    const file = new File([], "test.xlsx");
    await expect(parseExcelFile(file)).rejects.toThrow();
    await expect(parseExcelFile(file)).rejects.toMatchObject({
      type: "PARSING_ERROR",
      message: "엑셀 파일에 시트가 없습니다.",
    });
  });

  it("데이터가 없는 경우 에러를 반환한다", async () => {
    // FileReader 모의 구현
    const mockFileReaderInstance = {
      onload: null as
        | ((event: { target: { result: ArrayBuffer } }) => void)
        | null,
      onerror: null as ((event: Event) => void) | null,
      readAsArrayBuffer: vi.fn(function (this: {
        onload: ((event: { target: { result: ArrayBuffer } }) => void) | null;
      }) {
        setTimeout(() => {
          if (this.onload) {
            this.onload({ target: { result: new ArrayBuffer(8) } });
          }
        }, 0);
      }),
    };

    const mockFileReader = vi.fn(() => mockFileReaderInstance);
    global.FileReader = mockFileReader as unknown as typeof FileReader;

    (XLSX.read as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      SheetNames: ["Sheet1"],
      Sheets: {
        Sheet1: {
          "!ref": "A1:D10",
        },
      },
    });

    (
      XLSX.utils.sheet_to_json as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue([]);

    const file = new File([], "test.xlsx");
    await expect(parseExcelFile(file)).rejects.toThrow();
    await expect(parseExcelFile(file)).rejects.toMatchObject({
      type: "EMPTY_FILE",
      message: "파일에 데이터가 없습니다.",
    });
  });
});

describe("aggregateExcelData", () => {
  it("복지_ 파일 데이터를 올바르게 집계한다", () => {
    const mockFileData: FileData = {
      fileName: "복지_240401.xlsx",
      date: "2024/04/01",
      channelCode: "1003",
      data: [
        { 상품명: "상품A", 단품명: "옵션1", 수량: 2, 결제금액: 20000 },
        { 상품명: "상품A", 단품명: "옵션1", 수량: 3, 결제금액: 30000 },
        { 상품명: "상품B", 단품명: "옵션2", 수량: 1, 결제금액: 15000 },
      ],
    };

    const result = aggregateExcelData([mockFileData]);

    expect(result).toEqual([
      {
        date: "2024/04/01",
        channelCode: "1003",
        category: "",
        productName: "상품A",
        option: "옵션1",
        quantity: 5,
        sales: 50000,
      },
      {
        date: "2024/04/01",
        channelCode: "1003",
        category: "",
        productName: "상품B",
        option: "옵션2",
        quantity: 1,
        sales: 15000,
      },
    ]);
  });

  it("쇼핑_ 파일 데이터를 올바르게 집계한다", () => {
    const mockFileData: FileData = {
      fileName: "쇼핑_240401.xlsx",
      date: "2024/04/01",
      channelCode: "1004",
      data: [
        { 상품명: "상품X", 단품명: "옵션A", 수량: 2, 결제금액: 25000 },
        { 상품명: "상품X", 단품명: "옵션A", 수량: 1, 결제금액: 12500 },
        { 상품명: "상품Y", 단품명: "옵션B", 수량: 3, 결제금액: 45000 },
      ],
    };

    const result = aggregateExcelData([mockFileData]);

    expect(result).toEqual([
      {
        date: "2024/04/01",
        channelCode: "1004",
        category: "",
        productName: "상품X",
        option: "옵션A",
        quantity: 3,
        sales: 37500,
      },
      {
        date: "2024/04/01",
        channelCode: "1004",
        category: "",
        productName: "상품Y",
        option: "옵션B",
        quantity: 3,
        sales: 45000,
      },
    ]);
  });

  it("통합주문목록 파일 데이터를 올바르게 집계한다", () => {
    const mockFileData: FileData = {
      fileName: "통합주문목록.20240401.xlsx",
      date: "2024/04/01",
      channelCode: "1001",
      data: [
        {
          상품명: "상품C",
          옵션: "옵션X",
          수량: 2,
          "상품 결제금액": 20000,
          배송비: 3000,
        },
        {
          상품명: "상품C",
          옵션: "옵션X",
          수량: 1,
          "상품 결제금액": 10000,
          배송비: 0,
        },
        {
          상품명: "상품D",
          옵션: "옵션Y",
          수량: 3,
          "상품 결제금액": 45000,
          배송비: 3000,
        },
      ],
    };

    const result = aggregateExcelData([mockFileData]);

    expect(result).toEqual([
      {
        date: "2024/04/01",
        channelCode: "1001",
        category: "",
        productName: "상품C",
        option: "옵션X",
        quantity: 3,
        sales: 33000, // 20000 + 3000 + 10000
      },
      {
        date: "2024/04/01",
        channelCode: "1001",
        category: "",
        productName: "상품D",
        option: "옵션Y",
        quantity: 3,
        sales: 48000, // 45000 + 3000
      },
    ]);
  });

  it("지정일_주문 파일 데이터를 올바르게 집계한다", () => {
    const mockFileData: FileData = {
      fileName: "지정일_주문.20240401090534.xlsx",
      date: "2024/04/01",
      channelCode: "1001",
      data: [
        {
          상품명: "상품E",
          옵션: "옵션M",
          수량: 2,
          "상품 결제금액": 24000,
        },
        {
          상품명: "상품E",
          옵션: "옵션M",
          수량: 1,
          "상품 결제금액": 12000,
        },
        {
          상품명: "상품F",
          옵션: "옵션N",
          수량: 3,
          "상품 결제금액": 45000,
        },
      ],
    };

    const result = aggregateExcelData([mockFileData]);

    expect(result).toEqual([
      {
        date: "2024/04/01",
        channelCode: "1001",
        category: "",
        productName: "상품E",
        option: "옵션M",
        quantity: 3,
        sales: 36000, // 24000 + 12000
      },
      {
        date: "2024/04/01",
        channelCode: "1001",
        category: "",
        productName: "상품F",
        option: "옵션N",
        quantity: 3,
        sales: 45000,
      },
    ]);
  });

  it("네이버페이_전체주문발주발송관리 파일 데이터를 올바르게 집계한다", () => {
    const mockFileData: FileData = {
      fileName: "네이버페이_전체주문발주발송관리_20240401_0910.xlsx",
      date: "2024/04/01",
      channelCode: "1002",
      data: [
        {
          상품명: "상품G",
          옵션정보: "옵션P",
          수량: 2,
          "최종 상품별 총 주문금액": 30000,
          "배송비 합계": 3000,
        },
        {
          상품명: "상품G",
          옵션정보: "옵션P",
          수량: 1,
          "최종 상품별 총 주문금액": 15000,
          "배송비 합계": 0,
        },
        {
          상품명: "상품H",
          옵션정보: "옵션Q",
          수량: 3,
          "최종 상품별 총 주문금액": 60000,
          "배송비 합계": 3000,
        },
      ],
    };

    const result = aggregateExcelData([mockFileData]);

    expect(result).toEqual([
      {
        date: "2024/04/01",
        channelCode: "1002",
        category: "",
        productName: "상품G",
        option: "옵션P",
        quantity: 3,
        sales: 48000, // 30000 + 3000 + 15000
      },
      {
        date: "2024/04/01",
        channelCode: "1002",
        category: "",
        productName: "상품H",
        option: "옵션Q",
        quantity: 3,
        sales: 63000, // 60000 + 3000
      },
    ]);
  });

  it("여러 파일의 데이터를 올바르게 집계한다", () => {
    const mockFileData1: FileData = {
      fileName: "복지_240401.xlsx",
      date: "2024/04/01",
      channelCode: "1003",
      data: [{ 상품명: "상품A", 단품명: "옵션1", 수량: 2, 결제금액: 20000 }],
    };

    const mockFileData2: FileData = {
      fileName: "통합주문목록.20240401.xlsx",
      date: "2024/04/01",
      channelCode: "1001",
      data: [
        {
          상품명: "상품C",
          옵션: "옵션X",
          수량: 2,
          "상품 결제금액": 20000,
          배송비: 3000,
        },
      ],
    };

    const result = aggregateExcelData([mockFileData1, mockFileData2]);

    expect(result).toEqual([
      {
        date: "2024/04/01",
        channelCode: "1003",
        category: "",
        productName: "상품A",
        option: "옵션1",
        quantity: 2,
        sales: 20000,
      },
      {
        date: "2024/04/01",
        channelCode: "1001",
        category: "",
        productName: "상품C",
        option: "옵션X",
        quantity: 2,
        sales: 23000, // 20000 + 3000
      },
    ]);
  });
});
