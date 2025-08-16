import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchGenderStats,
  fetchChronicConditions,
  fetchAdmissions,
} from '@/redux/statsSlice';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, XAxis, YAxis, Bar, CartesianGrid, Legend
} from 'recharts';
import DashboardCard from './DashboardCard';

const PIE_COLORS = ['#4F46E5', '#10B981', '#F59E0B'];
const BAR_COLORS = ['#6366F1'];

export default function DashboardCharts() {
  const dispatch = useAppDispatch();
  const { genderStats, chronicConditions, admissions, averageAge } = useAppSelector((state) => state.stats);

  useEffect(() => {
    dispatch(fetchGenderStats());
    dispatch(fetchChronicConditions());
    dispatch(fetchAdmissions());
  }, [dispatch]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">

      {/* Average Age Card */}
      <div className="xl:col-span-2">
        <DashboardCard
          title="Average Age"
          value={averageAge ? `${averageAge} years` : 'Loading...'}
        />
      </div>

      {/* Gender Donut Chart with Side Labels */}
<div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex justify-center">
  <div className="w-full max-w-xl">
    <h2 className="text-xl font-semibold mb-4 text-center">Gender Breakdown</h2>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={genderStats}
          dataKey="count"
          nameKey="gender"
          cx="40%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          label={({ name, percent }) =>
            percent !== undefined ? `${(percent * 100).toFixed(1)}%` : ''
          }
          isAnimationActive
        >
          {genderStats.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend
          verticalAlign="middle"
          align="right"
          layout="vertical"
          wrapperStyle={{ fontSize: '12px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
</div>

    {/* Top Admission Reasons – compact */}
<div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex justify-center">
  <div className="w-full max-w-3xl">{/* narrower max width */}
    <h2 className="text-xl font-semibold mb-4 text-center">Top Admission Reasons</h2>
    <ResponsiveContainer width="100%" height={320}>{/* shorter height */}
      <PieChart>
        <Pie
  data={admissions.slice(0, 7)}
  dataKey="count"
  nameKey="reason"
  cx="50%"
  cy="46%"
  outerRadius={110}
  label={({ percent }) =>
    percent !== undefined ? `${(percent * 100).toFixed(1)}%` : ''
  }
  labelLine={false}
  isAnimationActive
>

          {admissions.slice(0, 7).map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#0EA5E9', '#9333EA', '#4B5563'][index % 7]}
            />
          ))}
        </Pie>

        <Tooltip formatter={(value: number, name: string, props: any) => [`${value} patients`, props?.payload?.reason ?? name]} />

        <Legend
          verticalAlign="bottom"
          align="center"
          layout="horizontal"
          wrapperStyle={{ fontSize: '12px', marginTop: 6 }}
        />
      </PieChart>
    </ResponsiveContainer>
  </div>
</div>


{/* Top Chronic Conditions – show all labels */}
<div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 xl:col-span-2">
  <h2 className="text-2xl font-semibold mb-6 text-center">Top Chronic Conditions</h2>

  {(() => {
    const rows = Math.max(1, chronicConditions.length);
    const rowHeight = 30;                           // px per row
    const chartHeight = Math.min(900, rows * rowHeight + 80);

    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chronicConditions}
          layout="vertical"
          margin={{ top: 20, right: 50, left: 180, bottom: 20 }} 
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            dataKey="condition"
            type="category"
            width={260}        // wider label column
            interval={0}       // <-- show EVERY label
            tick={{ fontSize: 13 }}
          />
          <Tooltip
            formatter={(value: number) => [`${value} patients`, 'Count']}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Legend />
          <Bar
            dataKey="count"
            fill="#c5283d"
            barSize={16}       
            radius={[4, 4, 0, 0]}
            isAnimationActive
          />
        </BarChart>
      </ResponsiveContainer>
    );
  })()}
</div>


    </div>
  );
}
