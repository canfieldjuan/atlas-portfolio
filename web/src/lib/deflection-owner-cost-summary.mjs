const DEFLECTION_OWNER_COST_CARD_LIMIT = 6;
const DEFLECTION_BACKLOG_TABLE_LIMIT = 25;

function asRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {};
}

function rows(value) {
  return Array.isArray(value)
    ? value.filter((row) => typeof row === 'object' && row !== null && !Array.isArray(row))
    : [];
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function int(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function nonNegativeIntOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
}

function supportCost(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function visibleBacklogRows(section, rowLimit = DEFLECTION_BACKLOG_TABLE_LIMIT) {
  const data = asRecord(section?.data);
  const requestedLimit =
    nonNegativeIntOrNull(data.default_limit) ??
    nonNegativeIntOrNull(section?.default_limit) ??
    rowLimit;
  const limit = Math.min(rowLimit, requestedLimit);
  return rows(data.items).slice(0, limit);
}

function ownerCostRows(items) {
  const ownerRows = new Map();
  for (const row of items) {
    const ownerLane = text(row.owner_lane) || 'Unknown';
    const existing = ownerRows.get(ownerLane) ?? {
      ownerLane,
      estimatedSupportCost: 0,
      ticketCount: 0,
      rowCount: 0,
      laneCount: 1,
    };
    existing.estimatedSupportCost += supportCost(row.estimated_support_cost);
    existing.ticketCount += int(row.ticket_count);
    existing.rowCount += 1;
    ownerRows.set(ownerLane, existing);
  }
  return Array.from(ownerRows.values()).sort((a, b) => b.estimatedSupportCost - a.estimatedSupportCost);
}

export function ownerCostCards(items, cardLimit = DEFLECTION_OWNER_COST_CARD_LIMIT) {
  const groupedRows = ownerCostRows(items);
  if (groupedRows.length <= cardLimit) return groupedRows;

  const visibleRows = groupedRows.slice(0, cardLimit);
  const otherRows = groupedRows.slice(cardLimit);
  const other = otherRows.reduce(
    (total, row) => ({
      ownerLane: `Other (${otherRows.length.toLocaleString()} lane${otherRows.length === 1 ? '' : 's'})`,
      estimatedSupportCost: total.estimatedSupportCost + row.estimatedSupportCost,
      ticketCount: total.ticketCount + row.ticketCount,
      rowCount: total.rowCount + row.rowCount,
      laneCount: total.laneCount + row.laneCount,
    }),
    {
      ownerLane: '',
      estimatedSupportCost: 0,
      ticketCount: 0,
      rowCount: 0,
      laneCount: 0,
    },
  );
  return [...visibleRows, other];
}
