import * as XLSX from "xlsx";
import {
  type ChannelCode,
  type ExcelData,
  ExcelError,
  type FileData,
} from "./types";

export const parseFileName = (
  fileName: string
): { date: string; channelCode: ChannelCode } => {
  // 파일 이름이 '복지_250331' 등인 경우
  if (fileName.includes("복지_")) {
    const dateMatch = fileName.match(/복지_(\d{6})/);
    if (dateMatch?.[1]) {
      const dateString = dateMatch[1];
      const year = `20${dateString.substring(0, 2)}`;
      const month = dateString.substring(2, 4);
      const day = dateString.substring(4, 6);
      return { date: `${year}/${month}/${day}`, channelCode: "1003" };
    }
  }

  // 파일 이름이 '쇼핑_250331' 등인 경우
  if (fileName.includes("쇼핑_")) {
    const dateMatch = fileName.match(/쇼핑_(\d{6})/);
    if (dateMatch?.[1]) {
      const dateString = dateMatch[1];
      const year = `20${dateString.substring(0, 2)}`;
      const month = dateString.substring(2, 4);
      const day = dateString.substring(4, 6);
      return { date: `${year}/${month}/${day}`, channelCode: "1004" };
    }
  }

  // 파일 이름이 '통합주문목록.20250331090248' 등인 경우
  if (fileName.includes("통합주문목록")) {
    // 통합주문목록. 다음에 오는 8자리 날짜를 찾기 위한 정규식
    const dateMatch = fileName.match(/통합주문목록\.(\d{8})/);
    if (dateMatch?.[1]) {
      const dateString = dateMatch[1];
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return { date: `${year}/${month}/${day}`, channelCode: "1001" };
    }
  }

  // 파일 이름이 '지정일_주문.20250331090534' 등인 경우
  if (fileName.includes("지정일_주문")) {
    // 지정일_주문. 다음에 오는 8자리 날짜를 찾기 위한 정규식
    const dateMatch = fileName.match(/지정일_주문\.(\d{8})/);
    if (dateMatch?.[1]) {
      const dateString = dateMatch[1];
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return { date: `${year}/${month}/${day}`, channelCode: "1001" };
    }
  }

  // 파일 이름이 '네이버페이_전체주문발주발송관리_20250331_0910' 등인 경우
  if (fileName.includes("네이버페이_전체주문발주발송관리")) {
    // 8자리 날짜를 찾기 위한 정규식
    const dateMatch = fileName.match(/(\d{8})/);
    if (dateMatch?.[1]) {
      const dateString = dateMatch[1];
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return { date: `${year}/${month}/${day}`, channelCode: "1002" };
    }
  }

  // 파일 이름이 '네이버페이_구매확정내역_20250331_1154' 등인 경우
  if (fileName.includes("네이버페이_구매확정내역")) {
    // 8자리 날짜를 찾기 위한 정규식
    const dateMatch = fileName.match(/(\d{8})/);
    if (dateMatch?.[1]) {
      const dateString = dateMatch[1];
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return { date: `${year}/${month}/${day}`, channelCode: "1002" };
    }
  }

  // 날짜를 파싱할 수 없는 경우 현재 날짜 반환
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  console.warn(
    "파일명에서 날짜를 파싱할 수 없어 현재 날짜를 사용합니다:",
    fileName
  );

  // 파일 이름으로 채널코드 추측
  let channelCode: ChannelCode = "1001"; // 기본값

  if (fileName.includes("복지")) {
    channelCode = "1003";
  } else if (fileName.includes("쇼핑")) {
    channelCode = "1004";
  } else if (fileName.includes("네이버페이")) {
    channelCode = "1002";
  }

  return { date: `${year}/${month}/${day}`, channelCode };
};

export const parseExcelFile = (file: File): Promise<FileData> => {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith(".xlsx")) {
      reject(
        new ExcelError(
          "엑셀(.xlsx) 파일만 업로드 가능합니다.",
          "INVALID_FILE_TYPE"
        )
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // 워크북에서 시트 목록 가져오기
        const sheetNames = workbook.SheetNames;

        if (sheetNames.length === 0) {
          reject(
            new ExcelError("엑셀 파일에 시트가 없습니다.", "PARSING_ERROR")
          );
          return;
        }

        // 일반적인 시트 이름들
        const commonSheetNames = [
          "Sheet1",
          "Sheet2",
          "Sheet",
          "Excel",
          "발주발송관리",
          "구매확정내역",
        ];

        // 우선 찾을 시트 결정
        let targetSheetName = sheetNames[0]; // 기본값은 첫 번째 시트

        // 특정 파일 타입에 따라 시트 이름 결정 시도
        if (file.name.includes("복지_") || file.name.includes("쇼핑_")) {
          // Excel 시트가 있으면 사용
          if (sheetNames.includes("Excel")) {
            targetSheetName = "Excel";
          }
        } else if (file.name.includes("네이버페이_전체주문발주발송관리")) {
          // 발주발송관리 시트가 있으면 사용
          if (sheetNames.includes("발주발송관리")) {
            targetSheetName = "발주발송관리";
          }
        } else if (file.name.includes("네이버페이_구매확정내역")) {
          // 구매확정내역 시트가 있으면 사용
          if (sheetNames.includes("구매확정내역")) {
            targetSheetName = "구매확정내역";
          }
        } else {
          // 일반적인 시트 이름 중에 있는지 확인
          for (const name of commonSheetNames) {
            if (sheetNames.includes(name)) {
              targetSheetName = name;
              break;
            }
          }
        }

        const worksheet = workbook.Sheets[targetSheetName];

        if (!worksheet) {
          reject(
            new ExcelError(
              "파일에서 유효한 시트를 찾을 수 없습니다.",
              "PARSING_ERROR"
            )
          );
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<
          string,
          unknown
        >[];

        if (jsonData.length === 0) {
          reject(new ExcelError("파일에 데이터가 없습니다.", "EMPTY_FILE"));
          return;
        }

        // 파일명에서 날짜와 채널코드 파싱
        const { date, channelCode } = parseFileName(file.name);

        resolve({
          fileName: file.name,
          date,
          channelCode,
          data: jsonData,
        });
      } catch (error) {
        console.error("엑셀 파싱 오류:", error);
        reject(
          new ExcelError(
            "엑셀 파일 파싱 중 오류가 발생했습니다.",
            "PARSING_ERROR"
          )
        );
      }
    };

    reader.onerror = () => {
      reject(
        new ExcelError("파일 읽기 중 오류가 발생했습니다.", "PARSING_ERROR")
      );
    };

    reader.readAsArrayBuffer(file);
  });
};

export const aggregateExcelData = (fileDataList: FileData[]): ExcelData[] => {
  const result: ExcelData[] = [];

  for (const fileData of fileDataList) {
    const { date, channelCode, data } = fileData;

    try {
      // 채널별로 다른 필드 이름 처리
      if (channelCode === "1003" || channelCode === "1004") {
        // '복지_' 또는 '쇼핑_' 파일
        const productGroups = new Map<
          string,
          { quantity: number; sales: number }
        >();

        for (const row of data) {
          try {
            const productName = String(row.상품명 || "");
            const option = String(row.단품명 || "");
            const quantity = Number(row.수량 || 0);
            const sales = Number(row.결제금액 || 0);

            const key = `${productName}:::${option}`;

            if (productGroups.has(key)) {
              const group = productGroups.get(key);

              if (group) {
                group.quantity += quantity;
                group.sales += sales;
              }
            } else {
              productGroups.set(key, { quantity, sales });
            }
          } catch (error) {
            console.warn("데이터 처리 중 오류가 발생했습니다:", error);
          }
        }

        for (const [key, value] of productGroups.entries()) {
          const [productName, option] = key.split(":::");

          result.push({
            date,
            channelCode,
            category: "",
            productName,
            option,
            quantity: value.quantity,
            sales: value.sales,
          });
        }
      } else if (
        channelCode === "1001" &&
        fileData.fileName.includes("통합주문목록")
      ) {
        // '통합주문목록' 파일
        const productGroups = new Map<
          string,
          { quantity: number; sales: number }
        >();

        for (const row of data) {
          try {
            const productName = String(row.상품명 || "");
            const option = String(row.옵션 || "");
            const quantity = Number(row.수량 || 0);
            const productPrice = Number(row["상품 결제금액"] || 0);
            const shippingPrice = Number(row.배송비 || 0);
            const sales = productPrice + shippingPrice;

            const key = `${productName}:::${option}`;

            if (productGroups.has(key)) {
              const group = productGroups.get(key);

              if (group) {
                group.quantity += quantity;
                group.sales += sales;
              }
            } else {
              productGroups.set(key, { quantity, sales });
            }
          } catch (error) {
            console.warn("데이터 처리 중 오류가 발생했습니다:", error);
          }
        }

        for (const [key, value] of productGroups.entries()) {
          const [productName, option] = key.split(":::");

          result.push({
            date,
            channelCode,
            category: "",
            productName,
            option,
            quantity: value.quantity,
            sales: value.sales,
          });
        }
      } else if (
        channelCode === "1001" &&
        fileData.fileName.includes("지정일_주문")
      ) {
        // '지정일_주문' 파일
        const productGroups = new Map<
          string,
          { quantity: number; sales: number }
        >();

        for (const row of data) {
          try {
            const productName = String(row.상품명 || "");
            const option = String(row.옵션 || "");
            const quantity = Number(row.수량 || 0);
            const sales = Number(row["상품 결제금액"] || 0);

            const key = `${productName}:::${option}`;

            if (productGroups.has(key)) {
              const group = productGroups.get(key);

              if (group) {
                group.quantity += quantity;
                group.sales += sales;
              }
            } else {
              productGroups.set(key, { quantity, sales });
            }
          } catch (error) {
            console.warn("데이터 처리 중 오류가 발생했습니다:", error);
          }
        }

        for (const [key, value] of productGroups.entries()) {
          const [productName, option] = key.split(":::");

          result.push({
            date,
            channelCode,
            category: "",
            productName,
            option,
            quantity: value.quantity,
            sales: value.sales,
          });
        }
      } else if (channelCode === "1002") {
        // '네이버페이' 파일들
        const productGroups = new Map<
          string,
          { quantity: number; sales: number }
        >();

        for (const row of data) {
          try {
            const productName = String(row.상품명 || "");
            const option = String(row.옵션정보 || "");
            const quantity = Number(row.수량 || 0);
            const productPrice = Number(row["최종 상품별 총 주문금액"] || 0);
            const shippingPrice = Number(row["배송비 합계"] || 0);
            const sales = productPrice + shippingPrice;

            const key = `${productName}:::${option}`;

            if (productGroups.has(key)) {
              const group = productGroups.get(key);

              if (group) {
                group.quantity += quantity;
                group.sales += sales;
              }
            } else {
              productGroups.set(key, { quantity, sales });
            }
          } catch (error) {
            console.warn("데이터 처리 중 오류가 발생했습니다:", error);
          }
        }

        for (const [key, value] of productGroups.entries()) {
          const [productName, option] = key.split(":::");

          result.push({
            date,
            channelCode,
            category: "",
            productName,
            option,
            quantity: value.quantity,
            sales: value.sales,
          });
        }
      } else {
        // 기타 파일 (기본 처리)
        const productGroups = new Map<
          string,
          { quantity: number; sales: number }
        >();

        for (const row of data) {
          try {
            // 필드 이름이 다양할 수 있으므로 여러 가능성 시도
            const productName = String(
              row.상품명 || row.product_name || row.productName || ""
            );
            const option = String(
              row.옵션 || row.단품명 || row.옵션정보 || row.option || ""
            );
            const quantity = Number(row.수량 || row.quantity || row.qty || 0);
            const sales = Number(
              row.결제금액 ||
                row["상품 결제금액"] ||
                row["최종 상품별 총 주문금액"] ||
                row.sales ||
                row.price ||
                0
            );

            const key = `${productName}:::${option}`;

            if (productGroups.has(key)) {
              const group = productGroups.get(key);

              if (group) {
                group.quantity += quantity;
                group.sales += sales;
              }
            } else {
              productGroups.set(key, { quantity, sales });
            }
          } catch (error) {
            console.warn("데이터 처리 중 오류가 발생했습니다:", error);
          }
        }

        for (const [key, value] of productGroups.entries()) {
          const [productName, option] = key.split(":::");

          result.push({
            date,
            channelCode,
            category: "",
            productName,
            option,
            quantity: value.quantity,
            sales: value.sales,
          });
        }
      }
    } catch (error) {
      console.error("파일 처리 중 오류가 발생했습니다:", error);
    }
  }

  return result;
};

export const exportToExcel = (
  data: ExcelData[],
  fileName = "aggregated_data.xlsx"
): void => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "AggregatedData");
  XLSX.writeFile(workbook, fileName);
};
