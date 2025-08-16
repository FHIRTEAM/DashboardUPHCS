type Props = { title: string; value: number | string; };

export default function DashboardCard({ title, value }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-4 border">
      <h3 className="text-sm text-gray-500">{title}</h3>
      <p className="text-3xl font-bold text-blue-600 mt-1">{value}</p>
    </div>
  );
}
