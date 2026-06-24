CREATE TABLE IF NOT EXISTS portfolio_deflection_review_decisions (
  request_id text NOT NULL,
  review_key text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('keep_suppressed', 'promote_to_review')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, review_key),
  CHECK (request_id <> ''),
  CHECK (review_key ~ '^review_[0-9a-f]{24}$')
);

CREATE INDEX IF NOT EXISTS portfolio_deflection_review_decisions_request_id_idx
  ON portfolio_deflection_review_decisions (request_id, updated_at DESC);
