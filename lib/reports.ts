export type ReportCatalogEntry = {
  code: string;
  label: string;
  reports: Array<{
    code: string;
    label: string;
    params?: string[];
  }>;
};
