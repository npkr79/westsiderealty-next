CREATE TABLE IF NOT EXISTS link_health_log (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id           text        NOT NULL,
  url_type         text        NOT NULL,       -- 'developer' | 'market' | 'project'
  slug             text        NOT NULL,
  full_url         text        NOT NULL,
  http_status      integer,                   -- 0 = network error / timeout
  is_broken        boolean     NOT NULL DEFAULT false,
  response_time_ms integer,
  error_message    text,
  checked_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS link_health_log_run_id_idx     ON link_health_log(run_id);
CREATE INDEX IF NOT EXISTS link_health_log_is_broken_idx  ON link_health_log(is_broken);
CREATE INDEX IF NOT EXISTS link_health_log_checked_at_idx ON link_health_log(checked_at DESC);
