"use client";
import { useEffect } from "react";
import * as XLSX from "xlsx";

export default function Home() {
  useEffect(() => {}, []);

  const extractResolvedFiles = (log: any) => {
    const startMarker = "The following files have been resolved:";
    const endMarker = "BUILD SUCCESS";

    const logLines = log.split("\n");

    const startIndex = logLines.findIndex((line: any) =>
      line.includes(startMarker)
    );
    const endIndex =
      logLines.findIndex((line: any) => line.includes(endMarker)) - 2;

    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      return logLines
        .slice(startIndex + 1, endIndex)
        .filter((line: any) => line.trim() !== "")
        .map((line: string) => {
          const ary: any = [];
          const [time, data] = line.split("[INFO]");
          ary.push(time);
          for (let i = 0; i < data.length; i++) {
            ary.push(data.split(":")[i]);
          }
          return ary;
        });
    } else {
      return [];
    }
  };

  const handleSubmit = (event: any) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const textarea = formData.get("textarea");
    const extracted = extractResolvedFiles(textarea);

    const worksheet = XLSX.utils.aoa_to_sheet(extracted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");
    worksheet["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 20 }];
    XLSX.writeFile(workbook, "Logs.xlsx", { compression: true });
  };

  return (
    <form
      className="p-8 flex flex-col items-center gap-8"
      onSubmit={handleSubmit}
    >
      <span>Paste here 👇</span>
      <textarea
        name="textarea"
        className="p-1 h-[500px] w-full border outline-none"
        placeholder="log..."
      />
      <button className="border h-10 w-20">Export</button>
    </form>
  );
}
