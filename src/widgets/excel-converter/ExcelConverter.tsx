"use client";

import { useState } from "react";
import { ExcelUploadForm } from "@/features/excel-upload/ExcelUploadForm";
import { ExcelProgressDialog } from "@/features/excel-progress/ExcelProgressDialog";
import { ExcelResultTable } from "@/features/excel-result/ExcelResultTable";
import { ExcelData, ExcelError, FileData } from "@/entities/excel/types";
import { aggregateExcelData, parseExcelFile } from "@/entities/excel/utils";
import { toast } from "sonner";

export const ExcelConverter = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState<string>();
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [resultData, setResultData] = useState<ExcelData[]>([]);
  const [showResult, setShowResult] = useState(false);

  const handleFilesUploaded = async (files: File[]) => {
    if (files.length === 0) return;

    setIsLoading(true);
    setProgress(0);
    setCurrentFileIndex(0);
    setTotalFiles(files.length);
    setShowResult(false);

    try {
      const parsedFiles: FileData[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFileName(file.name);
        setCurrentFileIndex(i);

        // 각 파일마다 진행률 계산 (0-90%, 남은 10%는 집계 처리용)
        const fileStartProgress = (i / files.length) * 90;
        const fileEndProgress = ((i + 1) / files.length) * 90;

        // 파일 파싱 진행률 표시
        setProgress(fileStartProgress);

        try {
          const fileData = await parseExcelFile(file);
          parsedFiles.push(fileData);

          // 파일 처리 완료 진행률 표시
          setProgress(fileEndProgress);
        } catch (error) {
          if (error instanceof ExcelError) {
            toast.error(`[${file.name}] ${error.message}`);
          } else {
            toast.error(`[${file.name}] 파일 처리 중 오류가 발생했습니다.`);
            console.error(error);
          }
        }
      }

      // 집계 처리 진행
      setProgress(95);

      // 데이터가 파싱된 파일이 하나라도 있으면 처리 진행
      if (parsedFiles.length > 0) {
        const aggregatedData = aggregateExcelData(parsedFiles);
        setResultData(aggregatedData);
        setShowResult(true);
        toast.success("데이터 변환이 완료되었습니다.");
      } else {
        toast.error("처리할 수 있는 데이터가 없습니다.");
      }

      setProgress(100);
    } catch (error) {
      if (error instanceof ExcelError) {
        toast.error(error.message);
      } else {
        toast.error("데이터 처리 중 오류가 발생했습니다.");
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">엑셀 변환기</h1>

      <ExcelUploadForm
        onFilesUploaded={handleFilesUploaded}
        isLoading={isLoading}
      />

      <ExcelProgressDialog
        isOpen={isLoading}
        progress={progress}
        fileName={currentFileName}
        totalFiles={totalFiles}
        currentFileIndex={currentFileIndex}
      />

      {showResult && resultData.length > 0 && (
        <div className="mt-10">
          <ExcelResultTable data={resultData} />
        </div>
      )}
    </div>
  );
};
