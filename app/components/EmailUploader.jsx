import { useState, useRef } from "react";
import { Upload, FileText, X, Users, Mail, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export function EmailUploader({
  onEmailsUploaded,
  onCsvDataUploaded,
  disabled,
}) {
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [csvData, setCsvData] = useState(null);
  const fileInputRef = useRef(null);

  const parseCSV = (text) => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return null;

    // Parse headers
    const headerLine = lines[0];
    const headers = headerLine
      .split(",")
      .map((h) => h.trim().replace(/['"]/g, ""));

    // Find email column index
    const emailIndex = headers.findIndex(
      (h) =>
        h.toLowerCase().includes("email") ||
        (headers.length === 1 && h.includes("@"))
    );

    const data = [];
    const startIndex = headers.some((h) => h.toLowerCase().includes("email"))
      ? 1
      : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",").map((v) => v.trim().replace(/['"]/g, ""));
      const rowData = {};

      headers.forEach((header, index) => {
        rowData[header] = values[index] || "";
      });

      // If no explicit email header, find email in any column
      if (emailIndex === -1) {
        const emailValue = values.find(
          (v) => v.includes("@") && v.includes(".")
        );
        if (emailValue) {
          rowData.email = emailValue;
        }
      } else {
        rowData.email = values[emailIndex] || "";
      }

      // Add all rows, not just those with emails
      data.push(rowData);
    }

    return {
      headers: emailIndex === -1 ? ["email", ...headers] : headers,
      data,
      totalRows: data.length,
    };
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        const parsedData = parseCSV(text);

        if (!parsedData || parsedData.data.length === 0) {
          setError("No data found in the CSV file");
          setFileName("");
          setCsvData(null);
          return;
        }

        setCsvData(parsedData);
        const emails = parsedData.data
          .map((row) => row.email)
          .filter((email) => email && email.includes("@"));

        if (emails.length === 0) {
          setError("No valid email addresses found in the CSV file");
          setCsvData(null);
          return;
        }

        onEmailsUploaded([...new Set(emails)]); // Remove duplicates
        if (onCsvDataUploaded) {
          onCsvDataUploaded(parsedData);
        }
      } catch (err) {
        setError("Error parsing CSV file. Please check the format.");
        setFileName("");
        setCsvData(null);
      }
    };

    reader.onerror = () => {
      setError("Error reading file");
      setFileName("");
      setCsvData(null);
    };

    reader.readAsText(file);
  };

  const handleClear = () => {
    setFileName("");
    setError("");
    setCsvData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onEmailsUploaded([]);
    if (onCsvDataUploaded) {
      onCsvDataUploaded(null);
    }
  };

  const getColumnStats = () => {
    if (!csvData) return {};

    const stats = {};
    const totalRows = csvData.totalRows;

    csvData.headers.forEach((header) => {
      const filledCount = csvData.data.filter(
        (row) => row[header] && row[header].toString().trim() !== ""
      ).length;

      stats[header] = {
        filled: filledCount,
        total: totalRows,
        percentage: Math.round((filledCount / totalRows) * 100),
      };
    });

    return stats;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white border border-gray-200 shadow-sm">
        <div className="space-y-4">
          <div>
            <h3 className="text-gray-900 mb-1">Upload Recipients</h3>
            <p className="text-sm text-gray-600">
              Upload a CSV file containing email addresses (required)
            </p>
          </div>

          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
              disabled={disabled}
            />

            {!fileName ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-emerald-400 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <Upload className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-gray-700 text-sm">Click to upload CSV</p>
                    <p className="text-xs text-gray-500">
                      Email column is required
                    </p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm flex-1 truncate text-gray-700">
                  {fileName}
                </span>
                <button
                  onClick={handleClear}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                  disabled={disabled}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <p className="text-sm">{error}</p>
            </Alert>
          )}
        </div>
      </Card>

      {/* CSV Data Visualization Card */}
      {csvData && (
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-gray-900 font-medium">Data Overview</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Rows */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Total Rows
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {csvData.totalRows}
                </p>
              </div>

              {/* Total Emails */}
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">
                    Valid Emails
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-900">
                  {
                    csvData.data.filter(
                      (row) => row.email && row.email.includes("@")
                    ).length
                  }
                </p>
              </div>

              {/* Column Statistics */}
              {Object.entries(getColumnStats()).map(([column, stats]) => {
                if (column.toLowerCase() === "email") return null; // Skip email as it's shown above

                return (
                  <div
                    key={column}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {column}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {stats.filled}/{stats.total}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.percentage}% complete
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Column Details */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Column Breakdown
              </h4>
              <div className="space-y-2">
                {Object.entries(getColumnStats()).map(([column, stats]) => (
                  <div
                    key={column}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 capitalize min-w-20">
                        {column}
                      </span>
                      {column.toLowerCase() === "email" && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-medium">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {stats.filled}/{stats.total}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({stats.percentage}%)
                        </span>
                      </div>
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            column.toLowerCase() === "email"
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
