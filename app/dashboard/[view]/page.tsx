import Dashboard from '@/components/Dashboard';

export const metadata = {
  title: 'Dashboard — REMAP Intelligence',
};

// Phase 2 sub-views are locked. Any /dashboard/[view] deep link renders the
// shell (which shows the Generate view) until the claim flow is built.
export default async function DashboardViewPage({
  params,
}: {
  params: Promise<{ view: string }>;
}) {
  await params; // view is reserved for Phase 2 routing
  return <Dashboard />;
}
