"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";

const username = "tancisadmin";
const apiToken = "113ce39804adfcd9ac18f955e6755d0653";
const authString = `${username}:${apiToken}`;
const authBase64 = Buffer.from(authString).toString("base64");

const getLog = async (name: any, number: any, team?: any) => {
  try {
    const { data } = await axios.get(
      `/jenkins/${team ? `job/${team}/` : ""}job/${name}/${number}/consoleText`,
      { headers: { Authorization: `Basic ${authBase64}` } }
    );
    return data;
  } catch (error) {
    throw error;
    // console.log(error);
  }
};

const extractResolvedFiles = (log: any, name: any) => {
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
        // ary.push(time);
        ary.push(name);
        for (let i = 0; i < data.length; i++) {
          ary.push(data.split(":")[i]);
        }
        return ary;
      });
  } else {
    return [];
  }
};

export default function Home() {
  const [page, setPage] = useState("single");

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
  const [loading, setLoading] = useState(false);
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
        return name && number;
      });
    setList(_);
  };

  const handleSubmit2 = async (event: any) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const entries = Object.entries(Object.fromEntries(formData.entries()));
    const matched = Object.values(
      entries.reduce((prev: any, curr: any) => {
        const [key, value]: any = curr;
        const [index, target] = key.split("!@#$");
        if (!prev[index]) prev[index] = {};
        prev[index][target] = value;
        return prev;
      }, {})
    );

    setLoading(true);
    const workbook = XLSX.utils.book_new();
    let all = [];
    for (const item of matched) {
      const { team, name, number } = item as any;
      let log: any;
      try {
        log = await getLog(name, number, team);
        console.log(name, number, team, "success");
      } catch (error) {
        console.log(name, number, team, "failure");
      }
      if (log) {
        const extracted = extractResolvedFiles(log, name);
        all.push(...extracted);
      }
    }
    const worksheet = XLSX.utils.aoa_to_sheet(all);
    XLSX.utils.book_append_sheet(workbook, worksheet);
    worksheet["!cols"] = [{ wch: 30 }, { wch: 30 }, { wch: 30 }];
    XLSX.writeFile(workbook, `Resolved.xlsx`, { compression: true });
    setLoading(false);
  };

  return (
    <>
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
                  const [name, number, team] = item;
                  return (
                    <div key={name} className="text-sm flex gap-1">
                      <input
                        name={`${index}!@#$name`}
                        className="h-8 border p-1 outline-none focus:border-green-600 hover:border-green-600"
                        defaultValue={name}
                      />
                      <input
                        name={`${index}!@#$number`}
                        className="w-20 h-8 border p-1 outline-none focus:border-green-600 hover:border-green-600"
                        defaultValue={number}
                      />
                      <input
                        name={`${index}!@#$team`}
                        className="w-20 h-8 border p-1 outline-none focus:border-green-600 hover:border-green-600"
                        defaultValue={team}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </form>
        )}
      </div>
      {loading && createPortal(<Loading />, document.body)}
    </>
  );
};

const Loading = () => {
  const [dot, setDot] = useState(0);

  useEffect(() => {
    const timerId = setInterval(() => {
      setDot((prev) => (prev += 1));
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const dots = [...new Array(dot % 4).fill(".")];

  return (
    <div className="fixed w-screen h-screen top-0 left-0 bg-black/20 flex items-center justify-center text-7xl text-white">
      Loading{dots}
    </div>
  );
};

const Single = () => {
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
