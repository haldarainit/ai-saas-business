import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const templatePath = path.join(
      process.cwd(),
      "public",
      "email-template.csv"
    );

    // Check if template file exists
    if (!fs.existsSync(templatePath)) {
      return new Response("Template file not found", { status: 404 });
    }

    // Read the template file
    const templateContent = fs.readFileSync(templatePath, "utf-8");

    // Return the file with proper headers for download
    return new Response(templateContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="email-template.csv"',
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error downloading template:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
