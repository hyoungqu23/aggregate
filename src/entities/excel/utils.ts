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
  if (fileName.toLowerCase().includes("쇼핑_")) {
    const dateMatch = fileName.match(/쇼핑_(\d{6})/i);
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

/**
 * 가장 적절한 시트 이름 결정
 */
const getTargetSheetName = (sheetNames: string[], fileName: string): string => {
  // 일반적인 시트 이름들
  const commonSheetNames = [
    "Sheet1",
    "Sheet2",
    "Sheet",
    "Excel",
    "발주발송관리",
    "구매확정내역",
  ];

  // 기본값은 첫 번째 시트
  let targetSheetName = sheetNames[0];

  // 파일 타입에 따라 시트 이름 결정
  if (fileName.includes("복지_") || fileName.includes("쇼핑_")) {
    if (sheetNames.includes("Excel")) {
      targetSheetName = "Excel";
    }
  } else if (fileName.includes("네이버페이_전체주문발주발송관리")) {
    if (sheetNames.includes("발주발송관리")) {
      targetSheetName = "발주발송관리";
    }
  } else if (fileName.includes("네이버페이_구매확정내역")) {
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

  return targetSheetName;
};

/**
 * 엑셀 파일 파싱
 */
export const parseExcelFile = (file: File): Promise<FileData> => {
  return new Promise((resolve, reject) => {
    console.log(`파일 파싱 시작: ${file.name}`);

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
        console.log(`파일 읽기 완료: ${file.name}, 크기: ${data.length} bytes`);

        // 엑셀 파일 읽기
        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: true,
          cellNF: false,
        });

        // 워크북에서 시트 목록 가져오기
        const sheetNames = workbook.SheetNames;
        console.log(`발견된 시트: ${sheetNames.join(", ")}`);

        if (sheetNames.length === 0) {
          reject(
            new ExcelError("엑셀 파일에 시트가 없습니다.", "PARSING_ERROR")
          );
          return;
        }

        // 적절한 시트 선택
        const targetSheetName = getTargetSheetName(sheetNames, file.name);
        console.log(`선택된 시트: ${targetSheetName}`);

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

        // JSON으로 변환 (한글 필드명 유지, 날짜 형식 보존)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: undefined,
          raw: false,
          dateNF: "yyyy-mm-dd",
        }) as Record<string, unknown>[];

        if (jsonData.length === 0) {
          reject(new ExcelError("파일에 데이터가 없습니다.", "EMPTY_FILE"));
          return;
        }

        console.log(`파싱된 데이터 행 수: ${jsonData.length}`);
        console.log("첫 번째 행 샘플:", jsonData[0]);

        // 파일명에서 날짜와 채널코드 파싱
        const { date, channelCode } = parseFileName(file.name);
        console.log(`파싱된 날짜: ${date}, 채널코드: ${channelCode}`);

        // 결과 반환
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
    const { date, channelCode, data, fileName } = fileData;
    console.log(`파일 '${fileName}' 집계 시작, 데이터 행 수: ${data.length}`);

    try {
      // 데이터 필드명 확인
      if (data.length === 0) {
        console.log(`'${fileName}' 파일에 데이터가 없습니다.`);
        continue;
      }

      // 첫 번째 행의 모든 키 로깅
      const firstRow = data[0];
      const keys = Object.keys(firstRow);
      console.log(`'${fileName}' 데이터 필드명: ${keys.join(", ")}`);

      // 필드명 패턴 정의
      const productNamePatterns = [
        "상품명",
        "상 품 명",
        "제품명",
        "품명",
        "상품정보",
      ];
      const optionPatterns = ["단품명", "옵션", "옵션정보", "상품옵션"];
      const quantityPatterns = [
        "수량",
        "주문수량",
        "판매수량",
        "QTY",
        "Quantity",
      ];
      const salesPatterns = [
        "결제금액",
        "판매금액",
        "판매가",
        "상품금액",
        "상품 결제금액",
        "상품결제금액",
        "주문금액",
        "최종 상품별 총 주문금액",
      ];

      // 필드명 매핑 함수
      const findFieldByPatterns = (
        row: Record<string, unknown>,
        patterns: string[]
      ): unknown => {
        // 1. 정확한 필드명 일치 먼저 확인
        for (const pattern of patterns) {
          if (row[pattern] !== undefined) {
            return row[pattern];
          }
        }

        // 2. 대소문자 무시하고 포함 여부 확인
        const rowKeys = Object.keys(row);
        for (const key of rowKeys) {
          for (const pattern of patterns) {
            if (key.toLowerCase().includes(pattern.toLowerCase())) {
              return row[key];
            }
          }
        }

        return undefined;
      };

      // 채널별로 다른 필드 이름 처리
      if (channelCode === "1003" || channelCode === "1004") {
        // '복지_' 또는 '쇼핑_' 파일
        const productGroups = new Map<
          string,
          { quantity: number; sales: number }
        >();

        console.log(`처리 시작: ${fileName} (채널코드: ${channelCode})`);

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          try {
            // 디버그용 로깅 (처음 몇 개 행만)
            if (i < 3) {
              console.log(`행 ${i + 1} 데이터:`, JSON.stringify(row));
            }

            // 필드값 추출
            const productNameValue = findFieldByPatterns(
              row,
              productNamePatterns
            );
            const optionValue = findFieldByPatterns(row, optionPatterns);
            const quantityValue = findFieldByPatterns(row, quantityPatterns);
            const salesValue = findFieldByPatterns(row, salesPatterns);

            // 값 변환
            const productName = productNameValue
              ? String(productNameValue)
              : "";
            const option = optionValue ? String(optionValue) : "";
            const quantity = quantityValue ? Number(quantityValue) : 0;
            const sales = salesValue ? Number(salesValue) : 0;

            // 처리 로깅 (처음 몇 개 행만)
            if (i < 3) {
              console.log(
                `행 ${
                  i + 1
                } 처리결과: 상품명=${productName}, 옵션=${option}, 수량=${quantity}, 금액=${sales}`
              );
            }

            if (!productName) {
              continue; // 상품명 없으면 건너뛰기
            }

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
            console.warn(`행 ${i + 1} 처리 중 오류:`, error);
          }
        }

        // 결과 집계
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

        console.log(
          `'${fileName}' 처리 완료, 집계 항목 수: ${productGroups.size}`
        );
      } else if (channelCode === "1001" && fileName.includes("통합주문목록")) {
        // '통합주문목록' 파일
        const productGroups = new Map<
          string,
          { quantity: number; sales: number }
        >();

        for (const row of data) {
          try {
            // 원본 필드명 확인 (디버깅용)
            console.log(`행 필드명: ${Object.keys(row).join(", ")}`);

            const productName = String(row.상품명 || "");
            const option = String(row.옵션 || "");
            const quantity = Number(row.수량 || 0);

            // 다양한 필드명 처리
            let productPrice = 0;
            if (row["상품 결제금액"] !== undefined) {
              productPrice = Number(row["상품 결제금액"]);
            } else if (row.상품결제금액 !== undefined) {
              productPrice = Number(row.상품결제금액);
            } else if (row.결제금액 !== undefined) {
              productPrice = Number(row.결제금액);
            }

            let shippingPrice = 0;
            if (row.배송비 !== undefined) {
              shippingPrice = Number(row.배송비);
            }

            const sales = productPrice + shippingPrice;

            if (!productName) {
              console.warn("상품명이 없는 행 발견:", row);
              continue;
            }

            console.log(
              `처리된 데이터: 상품명=${productName}, 옵션=${option}, 수량=${quantity}, 상품가격=${productPrice}, 배송비=${shippingPrice}`
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
            console.warn("데이터 처리 중 오류가 발생했습니다:", error, row);
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

        console.log(
          `'${fileName}' 처리 완료, 집계 항목 수: ${productGroups.size}`
        );
      } else if (channelCode === "1001" && fileName.includes("지정일_주문")) {
        // '지정일_주문' 파일
        const productGroups = new Map<
          string,
          { quantity: number; sales: number }
        >();

        // 디버깅을 위해 첫 번째 행의 필드 확인
        if (data.length > 0) {
          console.log(
            `지정일_주문 파일 필드명: ${Object.keys(data[0]).join(", ")}`
          );
        }

        for (const row of data) {
          try {
            const productName = String(row.상품명 || "");
            const option = String(row.옵션 || "");
            const quantity = Number(row.수량 || 0);

            // 다양한 금액 필드 처리
            let sales = 0;

            if (row["상품 결제금액"] !== undefined) {
              sales = Number(row["상품 결제금액"]);
            } else if (row.상품결제금액 !== undefined) {
              sales = Number(row.상품결제금액);
            } else if (row.주문금액 !== undefined) {
              sales = Number(row.주문금액);
            } else if (row.결제금액 !== undefined) {
              sales = Number(row.결제금액);
            }

            // 배송비 추가 (있는 경우)
            if (row.배송비 !== undefined && !Number.isNaN(Number(row.배송비))) {
              sales += Number(row.배송비);
            }

            // 디버깅
            console.log(
              `지정일_주문 행 처리: 상품명=${productName}, 금액필드=${
                row["상품 결제금액"] !== undefined
                  ? "상품 결제금액"
                  : row.상품결제금액 !== undefined
                  ? "상품결제금액"
                  : row.주문금액 !== undefined
                  ? "주문금액"
                  : row.결제금액 !== undefined
                  ? "결제금액"
                  : "없음"
              }, 최종금액=${sales}`
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
            console.warn("데이터 처리 중 오류가 발생했습니다:", error, row);
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

        console.log(
          `'${fileName}' 처리 완료, 집계 항목 수: ${productGroups.size}`
        );
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
            console.warn("데이터 처리 중 오류가 발생했습니다:", error, row);
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
            if (Object.keys(row).length === 0) {
              console.warn("빈 행 발견, 건너뜁니다");
              continue;
            }

            // 가능한 모든 필드명 처리
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
                row.상품결제금액 ||
                row["최종 상품별 총 주문금액"] ||
                row.sales ||
                row.price ||
                0
            );

            if (!productName) {
              console.warn("상품명이 없는 행 발견:", row);
              continue;
            }

            console.log(
              `처리된 데이터: 상품명=${productName}, 옵션=${option}, 수량=${quantity}, 금액=${sales}`
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
            console.warn("데이터 처리 중 오류가 발생했습니다:", error, row);
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

        console.log(
          `'${fileName}' 처리 완료, 집계 항목 수: ${productGroups.size}`
        );
      }
    } catch (error) {
      console.error(`파일 '${fileName}' 처리 중 오류 발생:`, error);
    }
  }

  console.log(`전체 집계 결과: ${result.length}개 항목`);
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
