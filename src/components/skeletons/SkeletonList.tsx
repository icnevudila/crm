import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export default function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="bg-white rounded-lg p-4 shadow-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Skeleton height={20} width="60%" className="mb-2" />
              <Skeleton height={16} width="40%" />
            </div>
            <Skeleton height={40} width={100} />
          </div>
        </div>
      ))}
    </div>
  )
}







