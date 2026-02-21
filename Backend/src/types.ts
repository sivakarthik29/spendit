export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
}

export interface FinancialHealthData {
  score: number;
  status: 'Critical' | 'Fair' | 'Stable' | 'Excellent';
  metrics: {
    savingsRate: number;
    debtToIncome: number;
    emergencyFundMonths: number;
    discretionaryRatio: number;
  };
  vitals: {
    label: string;
    value: string;
    trend: 'improving' | 'declining' | 'stable';
    description: string;
  }[];
  recommendations: string[];
}

export interface ForecastData {
  combinedTrend: ChartDataPoint[];
  confidenceInterval: { min: number; max: number };
  insights: string[];
}

export interface FinancialInsights {
  expenseByCategory: ChartDataPoint[];
  monthlyTrend: ChartDataPoint[];
  keyObservations: string[];
  transactions?: Transaction[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isLoading?: boolean;
  relatedInsights?: FinancialInsights;
  attachedFiles?: string[];
}

export interface UploadedFile {
  name: string;
  type: string;
  data: string;
}
