import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  X,
  Users,
  Mail,
  BarChart3,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import FrostedGlassIcon from "@/components/frosted-glass-icon";

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
    <div className="space-y-8">
      <Card className="p-6 bg-background/60 backdrop-blur-sm border transition-all duration-300 hover:shadow-lg dark:bg-background/80">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <FrostedGlassIcon
              icon={<Database className="w-5 h-5" />}
              color="rgba(36, 101, 237, 0.5)"
              className="self-start"
            />
            <div>
              <h3 className="text-xl font-bold">Upload Recipients</h3>
              <p className="text-sm text-muted-foreground">
                Upload a CSV file containing email addresses (required)
              </p>
            </div>
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
                className="w-full p-8 border-2 border-dashed border-muted-foreground/25 rounded-xl bg-background/40 hover:bg-background/60 hover:border-primary/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-foreground text-lg font-medium">
                      Click to upload CSV
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Email column is required
                    </p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm flex-1 truncate text-foreground font-medium">
                  {fileName}
                </span>
                <button
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/10 rounded-lg"
                  disabled={disabled}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="border-destructive/20 bg-destructive/5"
            >
              <p className="text-sm">{error}</p>
            </Alert>
          )}
        </div>
      </Card>

      {/* CSV Data Visualization Card */}
      {csvData && (
        <Card className="p-6 bg-background/60 backdrop-blur-sm border transition-all duration-300 hover:shadow-lg dark:bg-background/80">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <FrostedGlassIcon
                icon={<BarChart3 className="w-5 h-5" />}
                color="rgba(236, 72, 153, 0.5)"
                className="self-start"
              />
              <div>
                <h3 className="text-xl font-bold">Data Overview</h3>
                <p className="text-sm text-muted-foreground">
                  CSV file analysis and statistics
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Rows */}
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Total Rows
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {csvData.totalRows}
                </p>
              </div>

              {/* Total Emails */}
              <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-foreground">
                    Valid Emails
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {
                    csvData.data.filter(
                      (row) => row.email && row.email.includes("@")
                    ).length
                  }
                </p>
              </div>

              {/* Column Statistics */}
              {Object.entries(getColumnStats())
                .slice(0, 2)
                .map(([column, stats]) => {
                  if (column.toLowerCase() === "email") return null; // Skip email as it's shown above

                  return (
                    <div
                      key={column}
                      className="bg-muted/50 p-4 rounded-xl border border-muted-foreground/20"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-foreground capitalize">
                          {column}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {stats.filled}/{stats.total}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.percentage}% complete
                      </p>
                    </div>
                  );
                })}
            </div>

            {/* Column Details */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-foreground mb-4">
                Column Breakdown
              </h4>
              <div className="space-y-3">
                {Object.entries(getColumnStats()).map(([column, stats]) => (
                  <div
                    key={column}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-muted-foreground/10"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground capitalize min-w-20">
                        {column}
                      </span>
                      {column.toLowerCase() === "email" && (
                        <span className="px-2 py-1 bg-green-500/10 text-green-600 text-xs rounded-full font-medium border border-green-500/20">
                          Required
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sm font-medium text-foreground">
                          {stats.filled}/{stats.total}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({stats.percentage}%)
                        </span>
                      </div>
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            column.toLowerCase() === "email"
                              ? "bg-green-500"
                              : "bg-primary"
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
