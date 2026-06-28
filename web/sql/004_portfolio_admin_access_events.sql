CREATE TABLE IF NOT EXISTS portfolio_admin_access_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id text NOT NULL,
  actor_kind text NOT NULL,
  action text NOT NULL CHECK (
    action IN ('admin_intake_view', 'gap_report_csv_download')
  ),
  target_type text NOT NULL,
  target_request_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS portfolio_admin_access_events_occurred_at_idx
  ON portfolio_admin_access_events (occurred_at DESC);

CREATE INDEX IF NOT EXISTS portfolio_admin_access_events_target_idx
  ON portfolio_admin_access_events (target_type, target_request_id);

CREATE OR REPLACE FUNCTION prevent_portfolio_admin_access_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'portfolio_admin_access_events is append-only';
END;
$$;

DROP TRIGGER IF EXISTS portfolio_admin_access_events_no_mutation
  ON portfolio_admin_access_events;

CREATE TRIGGER portfolio_admin_access_events_no_mutation
  BEFORE UPDATE OR DELETE ON portfolio_admin_access_events
  FOR EACH ROW
  EXECUTE FUNCTION prevent_portfolio_admin_access_event_mutation();

REVOKE UPDATE, DELETE ON portfolio_admin_access_events FROM PUBLIC;
