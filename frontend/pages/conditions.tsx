import React, { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  getAllPatients,
  getDashboardData,
  setPatientId,
} from '@/redux/conditionsSlice';
import Sidebar from '@/components/Sidebar';
import Select from 'react-select';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,  
  Tooltip,
  Title,
  Legend
} from 'chart.js';

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,   
  Tooltip,
  Title,
  Legend
);


import ConditionsAndComorbiditiesTable from '@/components/ConditionsAndComorbiditiesTable';
import HospitalVisitChart from '@/components/HospitalVisitChart';

const getMonthlyVisitDataFor2024 = (rawData: Record<string, number>) => {
  const monthLabels = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return monthLabels.map((label, idx) => {
    const key = `2024-${String(idx + 1).padStart(2, '0')}`;
    return {
      label,
      value: rawData[key] || 0,
    };
  });
};

export default function ConditionsPage() {
  const dispatch = useAppDispatch();
  const { patientList, patientId, dashboardData } = useAppSelector(
    (state) => state.conditions
  );

  const formattedPatients = useMemo(() => {
    return [...patientList]
      .sort((a, b) => parseInt(b.patient_id) - parseInt(a.patient_id))
      .map((p) => ({
        value: p.patient_id,
        label: `Patient ${parseInt(p.patient_id, 10)}`,
      }));
  }, [patientList]);

  useEffect(() => {
    dispatch(getAllPatients());
  }, [dispatch]);

  useEffect(() => {
    if (formattedPatients.length && !patientId) {
      const defaultId = formattedPatients[0].value;
      dispatch(setPatientId(defaultId));
    }
  }, [formattedPatients, patientId, dispatch]);

  useEffect(() => {
    if (patientId) {
      dispatch(getDashboardData(patientId));
    }
  }, [patientId, dispatch]);

  const handlePatientChange = (selected: any) => {
    const id = selected?.value;
    dispatch(setPatientId(id));
  };

  const visitData = useMemo(
    () => getMonthlyVisitDataFor2024(dashboardData?.monthly_visits || {}),
    [dashboardData?.monthly_visits]
  );

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 space-y-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="w-64">
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              Patient ID:
            </label>
            <Select
              options={formattedPatients}
              value={formattedPatients.find((opt) => opt.value === patientId)}
              onChange={handlePatientChange}
              isClearable={false}
              placeholder="Select Patient"
              className="text-sm"
            />
          </div>

          <h1 className="text-xl font-bold text-center flex-grow">
            Conditions, Healthcare Seeking Behavior & Recommendations
          </h1>

          <div className="text-right text-lg font-semibold text-green-700 bg-green-100 px-4 py-1 rounded">
            {dashboardData?.name || 'N/A'}
          </div>
        </div>

        {/* Table Component */}
        <ConditionsAndComorbiditiesTable
          groupedConditions={[
            {
              condition: 'Conditions',
              comorbidities: dashboardData?.conditions || [],
            },
            {
              condition: 'Comorbidities',
              comorbidities: dashboardData?.comorbidities || [],
            },
          ]}
        />

        {/* Chart Component */}
        <HospitalVisitChart
  visitData={visitData}
  avgLengthOfStay={Number(dashboardData?.avg_length_of_stay ?? 0)}
  avgTimeBetweenVisits={Number(dashboardData?.avg_time_between_visits ?? 0)}
/>

      </main>
    </div>
  );
}
