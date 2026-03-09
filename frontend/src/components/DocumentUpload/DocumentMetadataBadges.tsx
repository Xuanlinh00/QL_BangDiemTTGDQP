interface DocumentMetadataBadgesProps {
  academicYear?: string
  cohort?: string
  className?: string
  semester?: string
}

export default function DocumentMetadataBadges({
  academicYear,
  cohort,
  className,
  semester,
}: DocumentMetadataBadgesProps) {
  if (!academicYear && !cohort && !className && !semester) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {academicYear && (
        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
          📅 {academicYear}
        </span>
      )}
      {cohort && (
        <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
          🎓 {cohort}
        </span>
      )}
      {className && (
        <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
          👥 {className}
        </span>
      )}
      {semester && (
        <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs font-medium">
          📚 HK{semester}
        </span>
      )}
    </div>
  )
}
