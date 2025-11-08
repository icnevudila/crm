import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export default function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-card">
            <Skeleton height={16} width="60%" className="mb-4" />
            <Skeleton height={32} width="80%" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-card">
          <Skeleton height={24} width="40%" className="mb-4" />
          <Skeleton height={300} />
        </div>
        <div className="bg-white rounded-lg p-6 shadow-card">
          <Skeleton height={24} width="40%" className="mb-4" />
          <Skeleton height={300} />
        </div>
      </div>
    </div>
  )
}







