export interface PdfColumn {
  label: string;
  key: string;
  width?: string;
  format?: (value: any) => string;
}

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  generatedBy?: string;
  generatedAt?: Date;
  summary?: string;
  columns: PdfColumn[];
  rows: any[];
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value ? "Так" : "Ні";
  return String(value);
};

const formatDate = (date: Date) =>
  date.toLocaleString("uk-UA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const buildStyles = () => `
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.5;
      color: #1f2937;
      margin: 0;
      padding: 0;
      background: #f7f8fc;
    }

    .pdf-wrapper {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      background: #ffffff;
    }

    .report-header {
      padding-bottom: 18px;
      border-bottom: 2px solid #d1d5db;
      margin-bottom: 18px;
    }

    .report-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 6px;
      color: #111827;
    }

    .report-subtitle {
      font-size: 14px;
      color: #4b5563;
      margin: 0 0 4px;
    }

    .report-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 12px;
      color: #6b7280;
      margin-top: 8px;
    }

    .report-summary {
      margin: 18px 0;
      padding: 16px;
      background: #f3f4f6;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      font-size: 14px;
      color: #374151;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 18px;
      font-size: 12px;
    }

    .report-table th,
    .report-table td {
      border: 1px solid #d1d5db;
      padding: 12px 10px;
      text-align: left;
      vertical-align: top;
    }

    .report-table th {
      background: #f3f4f6;
      font-weight: 700;
      color: #111827;
    }

    .report-table tbody tr:nth-child(even) {
      background: #fafbfc;
    }

    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
      padding-top: 12px;
    }
  </style>
`;

const buildTableRows = (columns: PdfColumn[], rows: any[]) => {
  return rows
    .map((row) => {
      const cells = columns
        .map((column) => {
          const rawValue = row[column.key];
          const value = column.format
            ? column.format(rawValue)
            : formatValue(rawValue);
          return `<td>${value}</td>`;
        })
        .join("\n");

      return `<tr>${cells}</tr>`;
    })
    .join("\n");
};

const buildHeaderHtml = (options: PdfReportOptions) => {
  const generatedAt = options.generatedAt || new Date();
  return `
    <div class="pdf-wrapper">
      <div class="report-header">
        <h1 class="report-title">${options.title}</h1>
        ${options.subtitle ? `<p class="report-subtitle">${options.subtitle}</p>` : ""}
        <div class="report-meta">
          <span>Створено: ${formatDate(generatedAt)}</span>
          ${options.generatedBy ? `<span>Підготував: ${options.generatedBy}</span>` : ""}
          ${options.summary ? `<span>Опис: ${options.summary}</span>` : ""}
        </div>
      </div>
  `;
};

const buildFooterHtml = () => `
    <div class="footer">
      Згенеровано у BookStore Admin Panel. Документ призначений для внутрішнього використання.
    </div>
  </div>
`;

export const buildReportPdfHtml = (options: PdfReportOptions) => {
  const columnsHtml = options.columns
    .map(
      (column) =>
        `<th style="width:${column.width || "auto"};">${column.label}</th>`,
    )
    .join("\n");

  const rowsHtml = buildTableRows(options.columns, options.rows);

  return `
    <!doctype html>
    <html lang="uk">
      <head>
        <meta charset="utf-8" />
        <title>${options.title}</title>
        ${buildStyles()}
      </head>
      <body>
        ${buildHeaderHtml(options)}
        <table class="report-table">
          <thead>
            <tr>${columnsHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        ${buildFooterHtml()}
      </body>
    </html>
  `;
};

export const openPdfReport = (html: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Не вдалося відкрити вікно для PDF-експорту");
  }

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };
};

export const exportReportToPdf = (
  reportType: string,
  rows: any[],
  generatedBy = "BookStore Admin",
) => {
  console.log(generatedBy);
  const reportTitle = `Звіт: ${reportType === "sales" ? "Продажі" : reportType === "customers" ? "Клієнти" : "Аналіз цін"}`;
  const subtitle = `Експорт сформовано для звіту типу ${reportType}`;

  let columns: PdfColumn[] = [];
  let summary = "";

  if (reportType === "sales") {
    columns = [
      { label: "Назва книги", key: "BookTitle", width: "28%" },
      { label: "Категорія", key: "CategoryName", width: "18%" },
      { label: "Продано", key: "CopiesSold", width: "12%" },
      {
        label: "Дохід",
        key: "GeneratedRevenue",
        width: "15%",
        format: (value) => `${value} ₴`,
      },
    ];
    summary = `Усього рядків: ${rows.length}`;
  } else if (reportType === "customers") {
    columns = [
      { label: "Клієнт", key: "FullName", width: "24%" },
      { label: "Email", key: "Email", width: "24%" },
      { label: "Замовлень", key: "TotalOrders", width: "14%" },
      {
        label: "Витрачено",
        key: "TotalSpent",
        width: "14%",
        format: (value) => `${value} ₴`,
      },
    ];
    summary = `Усього клієнтів: ${rows.length}`;
  } else {
    columns = [
      { label: "Назва книги", key: "BookTitle", width: "28%" },
      {
        label: "Стара ціна",
        key: "OldPrice",
        width: "18%",
        format: (value) => `${value} ₴`,
      },
      {
        label: "Нова ціна",
        key: "NewPrice",
        width: "18%",
        format: (value) => `${value} ₴`,
      },
      {
        label: "Дата зміни",
        key: "ChangeDate",
        width: "18%",
        format: (value) =>
          value ? new Date(value).toLocaleDateString("uk-UA") : "",
      },
    ];
    summary = `Усього змін цін: ${rows.length}`;
  }

  const html = buildReportPdfHtml({
    title: reportTitle,
    subtitle,
    generatedBy,
    generatedAt: new Date(),
    summary,
    columns,
    rows,
  });

  openPdfReport(html);
};
