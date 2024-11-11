"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export default function Home() {
  const [page, setPage] = useState("single");

  useEffect(() => {
    getLog();
  }, []);

  const username = "tancisadmin";
  const apiToken = "113ce39804adfcd9ac18f955e6755d0653";
  const authString = `${username}:${apiToken}`;
  const authBase64 = Buffer.from(authString).toString("base64");

  const getLog = async () => {
    try {
      const response = await axios.get(
        "/jenkins/job/tancis-framework/372/consoleText",
        { headers: { Authorization: `Basic ${authBase64}` } }
      );

      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex">
      <div className="w-[200px] p-8 text-lg flex flex-col gap-4 [&_button]:h-10 hover:[&_button]:underline">
        <button type="button" onClick={() => setPage("single")}>
          Single
        </button>
        <button type="button" onClick={() => setPage("multiple")}>
          Multiple
        </button>
      </div>

      <div className="flex-1 p-16">
        {page === "single" && <Single />}
        {page === "multiple" && <Multiple />}
      </div>
    </div>
  );
}

const Multiple = () => {
  const [list, setList] = useState<any[]>([]);

  const handleSubmit1 = (event: any) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const list = formData.get("list") as string;
    const listLines = list.split("\n");
    const _ = listLines
      .map((item) => {
        return item.replaceAll(" ", "").split("\t");
      })
      .filter(([name, number]) => {
        return name !== "" && number !== "";
      });
    setList(_);
  };

  const handleSubmit2 = (event: any) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const entries = Object.entries(Object.fromEntries(formData.entries()));
    const matched = entries.reduce((prev: any, curr: any) => {
      const [key, value]: any = curr;
      const [index, target] = key.split("!@#$");
      if (!prev[index]) prev[index] = {};
      prev[index][target] = value;
      return prev;
    }, {});
    console.log(matched);
  };

  return (
    <div className="flex gap-4">
      <form className="flex-1 flex flex-col gap-8" onSubmit={handleSubmit1}>
        <span>Paste job & build number</span>
        <div className="flex-1 flex flex-col gap-4">
          <button className="border h-10 w-20 hover:border-green-600">
            Execute
          </button>
          <textarea
            name="list"
            spellCheck="false"
            className="text-sm p-1 h-[500px] w-full border outline-none focus:border-green-600 hover:border-green-600"
          />
        </div>
      </form>

      {!!list.length && (
        <form className="flex-1 flex flex-col gap-8" onSubmit={handleSubmit2}>
          <span>Export</span>
          <div className="flex flex-col gap-4">
            <button className="border h-10 w-20 hover:border-green-600">
              Export
            </button>
            <div className="gap-1 flex flex-col">
              {list.map((item, index) => {
                const [name, number] = item;
                return (
                  <div key={name} className="text-sm flex gap-1">
                    <input
                      name={`${index}!@#$name`}
                      className="h-8 border p-1 outline-none focus:border-green-600 hover:border-green-600"
                      defaultValue={name}
                    />
                    <input
                      name={`${index}!@#$number`}
                      className="h-8 border p-1 outline-none focus:border-green-600 hover:border-green-600"
                      defaultValue={number}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

const Single = () => {
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
    const name = (formData.get("name") || "Resolved") as string;
    const log = formData.get("log");
    const extracted = extractResolvedFiles(log);

    const worksheet = XLSX.utils.aoa_to_sheet(extracted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
    worksheet["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 30 }];
    XLSX.writeFile(workbook, `${name}.xlsx`, { compression: true });
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
      <span>File name</span>
      <input
        name="name"
        className="h-10 border p-1 outline-none focus:border-green-600 hover:border-green-600"
        placeholder="Resolved"
      />
      <span>Paste log here</span>
      <div className="flex flex-col gap-4">
        <button className="border h-10 w-20 hover:border-green-600">
          Export
        </button>
        <textarea
          name="log"
          spellCheck="false"
          className="text-sm p-1 h-[500px] w-full border outline-none focus:border-green-600 hover:border-green-600"
          placeholder="log..."
        />
      </div>
    </form>
  );
};
