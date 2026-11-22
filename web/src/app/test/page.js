import { connection } from 'next/server'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'

async function ClientsDump() {
  await connection()
  const supabase = await createClient()
  const { data, error } = await supabase.from('children').select('*')

  return (
    <pre>
      {JSON.stringify({ data, error }, null, 2)}
    </pre>
  )
}

export default function TestPage() {
  return (
    <Suspense fallback={<pre>Loading…</pre>}>
      <ClientsDump />
    </Suspense>
  )
}
