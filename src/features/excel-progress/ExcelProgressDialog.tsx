"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface ExcelProgressDialogProps {
  isOpen: boolean;
  progress: number;
  fileName?: string;
  totalFiles: number;
  currentFileIndex: number;
}

export const ExcelProgressDialog = ({
  isOpen,
  progress,
  fileName,
  totalFiles,
  currentFileIndex,
}: ExcelProgressDialogProps) => {
  return (
    <Dialog open={isOpen} modal={true}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">파일 처리 중...</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            데이터를 처리 중입니다. 잠시만 기다려주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-foreground">
              <span>진행률: {Math.round(progress)}%</span>
              <span>
                {currentFileIndex + 1}/{totalFiles} 파일
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          {fileName && (
            <div className="text-sm text-center">
              <p className="font-medium mb-1 text-foreground">
                현재 처리 중인 파일:
              </p>
              <p className="text-muted-foreground text-xs truncate">
                {fileName}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
