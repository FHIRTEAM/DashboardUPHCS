// components/HospitalVisitChart.tsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent } from '@/components/ui/card';

interface VisitData {
  label: string;
  value: number;
}

interface Props {
  visitData: VisitData[];
  avgLengthOfStay: number | null;
  avgTimeBetweenVisits: number | null; // 
}

const HospitalVisitChart: React.FC<Props> = ({
  visitData,
  avgLengthOfStay,
  avgTimeBetweenVisits,
}) => {
  const chartData = {
    labels: visitData.map((d) => d.label),
    datasets: [
      {
        label: 'Visit Count',
        data: visitData.map((d) => d.value),
        backgroundColor: '#22c55e',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Hospital Visit Frequency - 2024',
        font: { size: 18 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Visits' },
        ticks: { stepSize: 1 },
      },
      x: {
        title: { display: true, text: 'Month' },
      },
    },
  };

  return (
    <Card>
      <CardContent>
        {visitData.every((d) => d.value === 0) ? (
          <p className="text-center text-sm text-gray-500">
            No hospital visits found for 2024.
          </p>
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}

        {/* Stats Row */}
        <div className="mt-4 text-sm text-center text-gray-600 flex flex-col md:flex-row gap-2 justify-center">
          <span>
            Avg Length of Stay:{' '}
            <strong>{avgLengthOfStay !== null ? avgLengthOfStay : 'N/A'}</strong> day(s)
          </span>
          <span className="hidden md:inline-block">|</span>
          <span>
            Avg Time Between Visits:{' '}
            <strong>{avgTimeBetweenVisits !== null ? avgTimeBetweenVisits : 'N/A'}</strong> days
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default HospitalVisitChart;
