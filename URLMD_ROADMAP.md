# URLMD Roadmap (URL Management Dashboard)

## Implemented in this milestone
- URL short-link management (`url_links`) with status controls (`active`, `paused`, `expired`, `blocked`)
- Redirect engine integration through `redirect.php` for both QR and URLMD traffic
- URL click analytics (`url_clicks`) including device, OS, browser, country, referrer, bot flag
- QR integration: QR creation can attach existing URLMD link or auto-create one
- User dashboard URLMD pages:
  - Link list + create + pause/activate/delete
  - Per-link analytics view
- Admin URL moderation view and backend moderation endpoints
- Standalone entry page at `/urlmd`

## Proposed additional features and functional areas

### 1) Smart routing rules
- Route by country, device type, day/time, language
- Use fallback destination when no rule matches
- Priority-based rule evaluation with conflict detection

### 2) Native A/B testing and conversion tracking
- Multi-variant destination splits (weighted)
- Variant-level click + conversion stats
- Automatic winner suggestion based on confidence thresholds

### 3) Campaign and workspace layers
- Group links by campaign, project, and team
- Shared link templates (naming, slug format, tags)
- Team-level policies (expiry required, domain required, moderation strictness)

### 4) Alerting and anomaly detection
- Spike detection (sudden click bursts)
- Bot attack indicators and suspicious geo shifts
- Notification channels: webhook, email, Slack

### 5) Security and compliance enhancements
- External threat-intel lookups for destination URLs
- Signed API requests + scoped API keys + key rotation
- Data retention controls and export/delete workflows

### 6) Enterprise integrations
- Public REST API + SDK snippets
- Webhooks for `link.created`, `link.blocked`, `threshold.reached`
- SSO-ready auth model for large organizations

## Suggested next implementation order
1. Smart routing rules
2. A/B test reporting UI
3. Webhook event delivery
4. Campaign/workspace model
5. Alerting rules engine
 