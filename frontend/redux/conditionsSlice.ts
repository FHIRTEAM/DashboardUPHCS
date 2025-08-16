import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchDashboardData, fetchAllPatientIds } from '../services/api';

export const getDashboardData = createAsyncThunk(
  'conditions/getDashboardData',
  async (patientId: string) => {
    const res = await fetchDashboardData(patientId);
    return res;
  }
);

export const getAllPatients = createAsyncThunk(
  'conditions/getAllPatients',
  async () => {
    const res = await fetchAllPatientIds();
    return res;
  }
);

interface PatientEntry {
  patient_id: string;
  name: string;
}

interface DashboardData {
  name: string;
  monthly_visits: Record<string, number>;
  avg_length_of_stay: number;
  grouped_conditions?: {
    condition: string;
    comorbidities: string[];
  }[];
}

interface StateType {
  patientId: string;
  patientList: PatientEntry[];
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
}

const initialState: StateType = {
  patientId: '',
  patientList: [],
  dashboardData: null,
  loading: false,
  error: null
};

const conditionsSlice = createSlice({
  name: 'conditions',
  initialState,
  reducers: {
    setPatientId: (state, action: PayloadAction<string>) => {
      state.patientId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardData = action.payload;
      })
      .addCase(getDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load dashboard data';
      })

      .addCase(getAllPatients.pending, (state) => {
        state.error = null;
      })
      .addCase(getAllPatients.fulfilled, (state, action) => {
        state.patientList = action.payload;
      })
      .addCase(getAllPatients.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to load patient list';
        state.patientList = [];
      });
  }
});

export const { setPatientId } = conditionsSlice.actions;
export default conditionsSlice.reducer;
