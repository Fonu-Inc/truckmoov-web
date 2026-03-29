import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import JobActionsBar from './JobActionsBar'
import JobFormModal from './JobFormModal'
import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import JobCard from './JobCard'

export default function Dispatches() {
 const [openJobFormModal, setJobFormModal] = useState(false)

 return (
  <>
   <Card>
    <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>

     <p>All Dispatches</p>
     <Button onClick={() => setJobFormModal(true)}>
      <Plus className="h-4 w-4" />
      New Dispatch
     </Button>
    </CardHeader>
    <CardContent>
     <JobActionsBar />

     <div className='space-y-3'>
      <JobCard />
     </div>
    </CardContent>
   </Card>

   {/* modals */}
   <JobFormModal open={openJobFormModal} onOpenChange={setJobFormModal} />
  </>
 )
}
