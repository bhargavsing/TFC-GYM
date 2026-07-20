import { useQuery } from '@tanstack/react-query'
import { getMembers } from '../api/members.js'

const statusStyles = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  INACTIVE: 'bg-slate-50 text-slate-600 ring-slate-500/20',
  SUSPENDED: 'bg-amber-50 text-amber-700 ring-amber-600/20',
}

const joinedDate = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
})

function LoadingRows() {
  return (
    <>
      {[0, 1, 2].map((row) => (
        <tr key={row} className="animate-pulse">
          <td className="px-6 py-5" colSpan={5}>
            <div className="h-4 rounded-full bg-slate-100" />
          </td>
        </tr>
      ))}
    </>
  )
}

export function MemberTable() {
  const membersQuery = useQuery({
    queryKey: ['members'],
    queryFn: ({ signal }) => getMembers(signal),
  })

  return (
    <section
      aria-labelledby="members-heading"
      className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.24)]"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
        <div>
          <h2
            id="members-heading"
            className="text-lg font-semibold tracking-tight text-slate-950"
          >
            Member directory
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {membersQuery.data
              ? `${membersQuery.data.length} member${membersQuery.data.length === 1 ? '' : 's'}`
              : 'Current gym membership'}
          </p>
        </div>
        <button
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          onClick={() => membersQuery.refetch()}
          type="button"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-180 text-left">
          <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4 sm:pl-8">Member</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {membersQuery.isPending && <LoadingRows />}

            {membersQuery.isError && (
              <tr>
                <td className="px-6 py-12 text-center" colSpan={4}>
                  <p className="font-medium text-rose-700">
                    Couldn&apos;t load members
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {membersQuery.error.message}
                  </p>
                </td>
              </tr>
            )}

            {membersQuery.data?.length === 0 && (
              <tr>
                <td className="px-6 py-16 text-center" colSpan={4}>
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-50 text-xl">
                    ✦
                  </div>
                  <p className="mt-4 font-medium text-slate-900">
                    No members yet
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Add one through the API to see them here.
                  </p>
                </td>
              </tr>
            )}

            {membersQuery.data?.map((member) => (
              <tr
                key={member.id}
                className="transition-colors hover:bg-slate-50/70"
              >
                <td className="px-6 py-5 sm:pl-8">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-slate-500">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">
                  {member.phone}
                </td>
                <td className="px-6 py-5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[member.status]}`}
                  >
                    {member.status.toLowerCase()}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">
                  {joinedDate.format(new Date(member.joinedAt))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
