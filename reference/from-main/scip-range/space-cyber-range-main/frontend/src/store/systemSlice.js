// src/store/systemSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  serviceStatus: 'unknown',
  networkLatency: 0,
  lastUpdate: Date.now(),
  isConnected: false,
  heartbeatCount: 0  // For visual feedback
};

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    updateServiceStatus: (state, action) => {
      state.serviceStatus = action.payload;
      state.lastUpdate = Date.now();
    },
    updateNetworkLatency: (state, action) => {
      state.networkLatency = action.payload;
    },
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
    },
    incrementHeartbeat: (state) => {
      state.heartbeatCount += 1;
    },
    resetSystem: () => initialState
  }
});

export const { 
  updateServiceStatus, 
  updateNetworkLatency, 
  setConnectionStatus,
  incrementHeartbeat,
  resetSystem 
} = systemSlice.actions;

export default systemSlice.reducer;