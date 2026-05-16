CREATE TABLE IF NOT EXISTS portfolio_gap_report_submissions (
  request_id uuid PRIMARY KEY,
  submitted_at timestamptz NOT NULL,
  email text NOT NULL,
  company_name text NOT NULL,
  support_platform text,
  csv_blob_url text NOT NULL,
  csv_filename text NOT NULL,
  csv_size_bytes bigint,
  source_page text,
  source_offer text,
  notification_status text NOT NULL DEFAULT 'pending',
  notification_error text,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_gap_report_submissions_submitted_at_idx
  ON portfolio_gap_report_submissions (submitted_at DESC);

CREATE INDEX IF NOT EXISTS portfolio_gap_report_submissions_email_idx
  ON portfolio_gap_report_submissions (email);

CREATE INDEX IF NOT EXISTS portfolio_gap_report_submissions_company_name_idx
  ON portfolio_gap_report_submissions (company_name);
