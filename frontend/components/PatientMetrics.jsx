import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

const metricLabels = {
  heart_rate: 'Heart Rate (bpm)',
  resp_rate: 'Respiratory Rate (bpm)',
  bmi: 'Body Mass Index',
  bp_sys: 'Systolic BP (mmHg)',
  bp_dia: 'Diastolic BP (mmHg)',
  oxygen: 'Oxygen Saturation (%)',
};

const chartColors = {
  heart_rate: '#1E40AF',     // Indigo
  resp_rate: '#059669',      // Green
  bmi: '#D97706',            // Amber
  bp_sys: '#0EA5E9',         // Sky
  bp_dia: '#9333EA',         // Purple
  oxygen: '#2563EB',         // Blue
};

export default function PatientMetrics() {
  const [metrics, setMetrics] = useState({});
  const [patientId, setPatientId] = useState('');
  const [patientOptions, setPatientOptions] = useState([]);

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/metrics/patient-observations', {
        params: patientId ? { patient_id: patientId } : {},
      });
      setMetrics(response.data);

      const uniquePatients = new Set();
      Object.values(response.data).forEach((obsList) => {
        obsList.forEach((obs) => uniquePatients.add(obs.patient_id));
      });
      setPatientOptions([...uniquePatients]);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patient Metrics</h1>
        <select
          className="border rounded px-3 py-1 text-sm"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
        >
          <option value="">All Patients</option>
          {patientOptions.map((id) => (
            <option key={id} value={id}>
              Patient {id}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(metrics).map(([key, data]) => {
          if (!data.length) return null;

          const maxValue = Math.max(...data.map((d) => d.value || 0));
          const customDomain =
            key === 'oxygen'
              ? [maxValue - 30, maxValue + 10]  // center oxygen
              : [0, maxValue + 10];

          return (
            <Card key={key} className="rounded-2xl shadow-lg p-4">
              <CardContent>
                <h2 className="text-lg font-semibold mb-2">
                  {metricLabels[key] || key}
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      domain={customDomain}
                      tick={{ fontSize: 12 }}
                      label={{
                        value:
                          (metricLabels[key] &&
                            metricLabels[key].split('(')[1]?.replace(')', '')) ||
                          '',
                        angle: -90,
                        position: 'insideLeft',
                        offset: 10,
                      }}
                    />
                    <Tooltip
                      formatter={(value, name, props) => [
                        value,
                        `${name} (Patient ${props.payload.patient_id})`,
                      ]}
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={chartColors[key] || '#10B981'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
