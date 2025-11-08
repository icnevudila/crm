import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export default function SkeletonDetail() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-card">
        <Skeleton height={32} width="40%" className="mb-4" />
        <Skeleton height={20} width="60%" />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-card">
          <Skeleton height={24} width="50%" className="mb-4" />
          <Skeleton height={16} width="80%" className="mb-2" />
          <Skeleton height={16} width="70%" className="mb-2" />
          <Skeleton height={16} width="90%" />
        </div>
        <div className="bg-white rounded-lg p-6 shadow-card">
          <Skeleton height={24} width="50%" className="mb-4" />
          <Skeleton height={200} />
        </div>
      </div>
    </div>
  )
}







