// lib/models/predictionLog.ts
// Stores daily prediction validation results.
// Written by the 24hr cron — read by the analytics route to apply bias correction.

import { ObjectId } from "mongodb";

export interface HourlySlot {
  hour: number;
  predicted: number;  // 0–100 normalised
  actual: number;     // 0–100 normalised
  error: number;      // actual - predicted (negative = over-predicted)
}

export interface PredictionLogDocument {
  _id?: ObjectId;
  date: string;               // "YYYY-MM-DD" WAT — the day being validated
  slots: HourlySlot[];        // 24 slots
  totalPredicted: number;     // sum of predicted volumes
  totalActual: number;        // sum of actual check-in volumes
  maeScore: number;           // Mean Absolute Error 0–100 (lower = better)
  accuracyPct: number;        // 100 - MAE (higher = better)
  biasVector: number[];       // 24-length array of correction offsets
  appliedAt: Date;
  visitDataPoints: number;    // how many visit records fed the prediction
  checkinDataPoints: number;  // how many real check-ins were recorded that day
}