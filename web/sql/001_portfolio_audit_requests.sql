CREATE TABLE IF NOT EXISTS portfolio_audit_requests (
  request_id uuid PRIMARY KEY,
  submitted_at timestamptz NOT NULL,
  full_name text NOT NULL,
  work_email text NOT NULL,
  company_or_project_url text NOT NULL,
  role_and_decision_scope text NOT NULL,
  project_interest text NOT NULL,
  project_interest_label text,
  source_page text,
  source_page_label text,
  source_offer text,
  source_offer_label text,
  biggest_bottleneck text NOT NULL,
  automation_data_sources text NOT NULL,
  current_tech_ecosystem text,
  desired_timeline text NOT NULL,
  desired_timeline_label text,
  security_requirement text NOT NULL,
  security_requirement_label text,
  deployment_constraints text,
  roi_goal text,
  anticipated_investment_range text NOT NULL,
  anticipated_investment_range_label text,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_audit_requests_submitted_at_idx
  ON portfolio_audit_requests (submitted_at DESC);

CREATE INDEX IF NOT EXISTS portfolio_audit_requests_project_interest_idx
  ON portfolio_audit_requests (project_interest);

CREATE INDEX IF NOT EXISTS portfolio_audit_requests_source_idx
  ON portfolio_audit_requests (source_page, source_offer);
