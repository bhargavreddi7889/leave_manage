'use client'

import { Users, CheckCircle2, XCircle } from 'lucide-react'

interface TeamMember {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  department?: string
  isOnLeave: boolean
}

interface TeamAvailabilityCardProps {
  teamMembers: TeamMember[]
}

export default function TeamAvailabilityCard({ teamMembers }: TeamAvailabilityCardProps) {
  const availableCount = teamMembers.filter(m => !m.isOnLeave).length
  const onLeaveCount = teamMembers.filter(m => m.isOnLeave).length
  const totalCount = teamMembers.length

  return (
    <div className="card">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <Users className="w-5 h-5 mr-2 text-indigo-600" />
        Team Availability
      </h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 hover:border-green-300 hover:shadow-md transition-all duration-300 cursor-pointer group">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Available</span>
            </div>
            <p className="text-2xl font-bold text-green-600 group-hover:scale-110 transition-transform duration-300">{availableCount}</p>
            <p className="text-xs text-gray-500 mt-1">out of {totalCount} members</p>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:bg-orange-100 hover:border-orange-300 hover:shadow-md transition-all duration-300 cursor-pointer group">
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">On Leave</span>
            </div>
            <p className="text-2xl font-bold text-orange-600 group-hover:scale-110 transition-transform duration-300">{onLeaveCount}</p>
            <p className="text-xs text-gray-500 mt-1">currently</p>
          </div>
        </div>

        {teamMembers.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Team Members</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {teamMembers.slice(0, 6).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 hover:shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${member.isOnLeave ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{member.employeeId}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    member.isOnLeave 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {member.isOnLeave ? 'On Leave' : 'Available'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

