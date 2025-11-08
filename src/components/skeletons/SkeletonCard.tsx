import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg p-6 shadow-card">
      <Skeleton height={24} width="60%" className="mb-4" />
      <Skeleton height={16} width="80%" className="mb-2" />
      <Skeleton height={16} width="70%" />
    </div>
  )
}







