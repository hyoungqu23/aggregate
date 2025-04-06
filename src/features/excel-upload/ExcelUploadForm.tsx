"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UploadCloud, X } from "lucide-react";
import { cls } from "@/shared/lib/utils";
import { ExcelError } from "@/entities/excel/types";
import { toast } from "sonner";

interface ExcelUploadFormProps extends React.ComponentPropsWithoutRef<"form"> {
  onFilesUploaded: (files: File[]) => void;
  isLoading?: boolean;
}

interface FormValues {
  files: FileList;
}

export const ExcelUploadForm = ({
  onFilesUploaded,
  isLoading = false,
  ...props
}: ExcelUploadFormProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 input을 직접 관리하므로 React Hook Form의 register를 사용하지 않음
  const {
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (filesArray: File[]) => {
    const excelFiles = filesArray.filter((file) => file.name.endsWith(".xlsx"));

    if (excelFiles.length !== filesArray.length) {
      toast.error("엑셀(.xlsx) 파일만 업로드 가능합니다.");
      return;
    }

    setSelectedFiles((prevFiles) => [...prevFiles, ...excelFiles]);

    // 파일 선택 후 input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const onSubmit = () => {
    if (selectedFiles.length === 0) {
      toast.error("최소 하나 이상의 파일을 선택해주세요.");
      return;
    }

    try {
      onFilesUploaded(selectedFiles);
    } catch (error) {
      if (error instanceof ExcelError) {
        toast.error(error.message);
      } else {
        toast.error("파일 처리 중 오류가 발생했습니다.");
        console.error(error);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      addFiles(Array.from(files));
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleDropZoneClick();
    }
  };

  return (
    <Card className="w-full bg-card border-border shadow-lg">
      <CardHeader className="pb-4 space-y-2">
        <CardTitle className="text-xl text-card-foreground">
          엑셀 파일 업로드
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          변환하려는 Excel 파일을 업로드해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} {...props}>
          <div className="space-y-6">
            <div
              className={cls(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                "hover:border-primary/50 hover:bg-muted/30",
                isDragging ? "border-primary bg-muted/30" : "border-border",
                errors.files ? "border-destructive" : ""
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleDropZoneClick}
              onKeyDown={handleKeyDown}
              aria-label="파일 업로드 영역. 클릭하거나 파일을 드래그하세요."
            >
              <UploadCloud className="w-12 h-12 mx-auto mb-4 text-primary/60" />
              <p className="text-sm font-medium mb-2 text-card-foreground">
                파일을 여기에 드래그하거나 클릭하세요
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                * XLSX 확장자만 지원됩니다
              </p>
              <Input
                type="file"
                accept=".xlsx"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-card-foreground flex items-center">
                  <span>선택된 파일</span>
                  <span className="ml-2 px-2 py-0.5 bg-muted text-xs rounded-full">
                    {selectedFiles.length}
                  </span>
                </p>
                <div className="max-h-60 overflow-auto rounded-md border border-border p-1">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between bg-muted/20 rounded-sm p-2 mb-1.5 hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-sm truncate max-w-[80%] text-card-foreground">
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFile(index)}
                        disabled={isLoading}
                        className="text-muted-foreground hover:text-destructive hover:bg-transparent h-6 w-6"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="pt-2 pb-6">
        <Button
          type="button"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={onSubmit}
          disabled={isLoading || selectedFiles.length === 0}
        >
          {isLoading ? "처리 중..." : "파일 변환하기"}
        </Button>
      </CardFooter>
    </Card>
  );
};
