"use client";

import { useEffect, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import type { ExcelData } from "@/entities/excel/types";
import { exportToExcel } from "@/entities/excel/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, SortAsc, SortDesc } from "lucide-react";

interface ExcelResultTableProps {
  data: ExcelData[];
}

export const ExcelResultTable = ({ data }: ExcelResultTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [tableData, setTableData] = useState<ExcelData[]>([]);

  useEffect(() => {
    setTableData(data);
  }, [data]);

  const columns: ColumnDef<ExcelData>[] = [
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            날짜
            {column.getIsSorted() === "asc" ? (
              <SortAsc className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <SortDesc className="ml-2 h-4 w-4" />
            ) : null}
          </Button>
        );
      },
    },
    {
      accessorKey: "channelCode",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            채널코드
            {column.getIsSorted() === "asc" ? (
              <SortAsc className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <SortDesc className="ml-2 h-4 w-4" />
            ) : null}
          </Button>
        );
      },
    },
    {
      accessorKey: "category",
      header: "카테고리",
    },
    {
      accessorKey: "productName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            상품명
            {column.getIsSorted() === "asc" ? (
              <SortAsc className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <SortDesc className="ml-2 h-4 w-4" />
            ) : null}
          </Button>
        );
      },
    },
    {
      accessorKey: "option",
      header: "옵션",
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            수량
            {column.getIsSorted() === "asc" ? (
              <SortAsc className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <SortDesc className="ml-2 h-4 w-4" />
            ) : null}
          </Button>
        );
      },
      cell: ({ row }) => {
        const quantity = row.getValue("quantity") as number;
        return (
          <div className="text-right font-medium">
            {quantity.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: "sales",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            매출
            {column.getIsSorted() === "asc" ? (
              <SortAsc className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <SortDesc className="ml-2 h-4 w-4" />
            ) : null}
          </Button>
        );
      },
      cell: ({ row }) => {
        const sales = row.getValue("sales") as number;
        return (
          <div className="text-right font-medium">
            {sales.toLocaleString()}원
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleDownload = () => {
    exportToExcel(data, "엑셀_변환_결과.xlsx");
  };

  return (
    <div className="space-y-6 bg-card p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">변환 결과</h2>
        <Button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          size="sm"
        >
          <Download className="h-4 w-4" />
          <span>엑셀 다운로드</span>
        </Button>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-border hover:bg-muted"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-foreground py-4 bg-muted/30"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-border hover:bg-muted/20"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-foreground py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4 border-t border-border">
        <div className="flex-1 text-sm text-muted-foreground">
          총 {table.getFilteredRowModel().rows.length}개의 항목
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-sm font-medium">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}{" "}
            페이지
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="text-foreground border-border h-8 px-3"
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="text-foreground border-border h-8 px-3"
            >
              다음
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
