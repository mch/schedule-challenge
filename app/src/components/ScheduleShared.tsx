/**
 * Shared sub-components used by both SessionListView and PersonalScheduleView.
 *
 * - DayTabs   — tablist of conference days
 * - Filters   — tag / stage dropdowns + hide-past-events toggle
 */

// ---------------------------------------------------------------------------
// DayTabs
// ---------------------------------------------------------------------------

export interface DayTabsProps {
  days: { id: number; name: string }[]
  selectedIndex: number
  onSelect: (index: number) => void
  /** Prefix for generated tab/panel IDs (default: "day") */
  idPrefix?: string
}

export function DayTabs({ days, selectedIndex, onSelect, idPrefix = 'day' }: DayTabsProps) {
  return (
    <div className="day-tabs" role="tablist" aria-label="Conference days">
      {days.map((day, i) => (
        <button
          key={day.id}
          role="tab"
          aria-selected={i === selectedIndex}
          aria-controls={`${idPrefix}-panel-${i}`}
          id={`${idPrefix}-tab-${i}`}
          className={`day-tab${i === selectedIndex ? ' day-tab--active' : ''}`}
          onClick={() => onSelect(i)}
        >
          {day.name}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface FiltersProps {
  tags: string[]
  stages: string[]
  selectedTag: string
  selectedStage: string
  hidePastEvents: boolean
  onTagChange: (tag: string) => void
  onStageChange: (stage: string) => void
  onToggleHidePastEvents: () => void
  hidePastEventsDisabled: boolean
  /** ID prefix for the select elements to avoid duplicate IDs (default: "") */
  idPrefix?: string
}

export function Filters({
  tags,
  stages,
  selectedTag,
  selectedStage,
  hidePastEvents,
  onTagChange,
  onStageChange,
  onToggleHidePastEvents,
  hidePastEventsDisabled,
  idPrefix = '',
}: FiltersProps) {
  const tagId = `${idPrefix}tag-filter`
  const stageId = `${idPrefix}stage-filter`

  return (
    <div className="session-filters" aria-label="Session filters">
      <label className="filter-label" htmlFor={tagId}>
        Tag
        <select
          id={tagId}
          aria-label="Tag filter"
          className="filter-select"
          value={selectedTag}
          onChange={(e) => onTagChange(e.target.value)}
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-label" htmlFor={stageId}>
        Stage / Room
        <select
          id={stageId}
          aria-label="Stage filter"
          className="filter-select"
          value={selectedStage}
          onChange={(e) => onStageChange(e.target.value)}
        >
          <option value="">All stages</option>
          {stages.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-label filter-label--toggle">
        <input
          type="checkbox"
          className="filter-toggle"
          checked={hidePastEvents}
          onChange={onToggleHidePastEvents}
          disabled={hidePastEventsDisabled}
          aria-label="Hide past events"
        />
        Hide past events
      </label>

      {(selectedTag || selectedStage) && (
        <button
          className="filter-clear"
          onClick={() => { onTagChange(''); onStageChange('') }}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
