
export interface Rod {
  id: string;
  length: number;
  quantity: number;
}

export interface CutPiece {
  length: number;
}

export interface StockRodUsage {
  stockRodLength: number;
  cuts: CutPiece[];
  totalCutsLength: number;
  kerfWaste: number;
  offcutWaste: number;
}

export interface UnfulfilledCut {
  length: number;
  quantity: number;
}

export interface CuttingPlan {
  plan: StockRodUsage[];
  summary: {
    totalStockUsedLength: number;
    totalCutPiecesLength: number;
    totalKerfWaste: number;
    totalOffcutWaste: number;
    totalWaste: number;
    wastePercentage: number;
    unfulfilledCuts: UnfulfilledCut[];
  };
}
