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

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-card-foreground">엑셀 파일 업로드</CardTitle>
        <CardDescription className="text-muted-foreground">
          변환하려는 Excel 파일을 업로드해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} {...props}>
          <div className="space-y-4">
            <div
              className={cls(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                "hover:border-primary/50 hover:bg-muted/30",
                isDragging ? "border-primary bg-muted/30" : "border-border",
                errors.files ? "border-destructive" : ""
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              aria-label="파일 업로드 영역. 클릭하거나 파일을 드래그하세요."
            >
              <UploadCloud className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1 text-card-foreground">
                파일을 여기에 드래그하거나 선택하세요
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                또는 아래 버튼을 클릭하여 파일을 선택하세요
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                * XLSX 확장자만 지원됩니다
              </p>
              <Button
                type="button"
                onClick={handleDropZoneClick}
                variant="outline"
                size="sm"
                className="mx-auto"
              >
                파일 선택하기
              </Button>
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
              <div className="space-y-2">
                <p className="text-sm font-medium text-card-foreground">
                  선택된 파일 ({selectedFiles.length})
                </p>
                <div className="max-h-60 overflow-auto">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between bg-muted/30 rounded p-2 mb-2"
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
                        className="text-muted-foreground hover:text-destructive hover:bg-transparent"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          className="w-full"
          onClick={onSubmit}
          disabled={isLoading || selectedFiles.length === 0}
        >
          {isLoading ? "처리 중..." : "파일 변환하기"}
        </Button>
      </CardFooter>
    </Card>
  );
};
