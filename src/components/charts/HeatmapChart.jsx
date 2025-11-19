// Presentational component: Weekly heatmap (weekday x amount bucket)
// Shows mode toggle (Gastos/Ingresos), the grid, and details of selected cell

import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

/**
 * @param {Object} props
 * @param {Array<Array<number>>} props.heatmapMatrix
 * @param {number} props.heatmapMax
 * @param {"gastos"|"ingresos"} props.chartHeatmapMode
 * @param {(m:"gastos"|"ingresos")=>void} props.setChartHeatmapMode
 * @param {{row:number,col:number,value:number}|null} props.selectedHeatmapCell
 * @param {(v:{row:number,col:number,value:number}|null)=>void} props.setSelectedHeatmapCell
 * @param {string[]} props.WEEKDAY_LABELS
 * @param {{label:string}[]} props.AMOUNT_BUCKETS
 * @param {string} props.cardBgClass
 * @param {string} props.textPrimary
 * @param {string} props.textMuted
 * @param {boolean} props.darkMode
 * @param {string} props.COLOR_GASTOS
 * @param {string} props.COLOR_INGRESOS
 * @param {(n:number)=>string} props.formatUsd
 */
export default function HeatmapChart({
  heatmapMatrix,
  heatmapMax,
  chartHeatmapMode,
  setChartHeatmapMode,
  selectedHeatmapCell,
  setSelectedHeatmapCell,
  WEEKDAY_LABELS,
  AMOUNT_BUCKETS,
  cardBgClass,
  textPrimary,
  textMuted,
  darkMode,
  COLOR_GASTOS,
  COLOR_INGRESOS,
  formatUsd,
}) {
  const cardBgColor = darkMode ? "#111827" : "#ffffff";
  const cardShadowColor = darkMode ? "#000000" : "#0f172a";
  const toggleInactiveBg = darkMode ? "#1f2937" : "#e5e7eb";
  const toggleInactiveText = darkMode ? "#e5e7eb" : "#1f2937";
  const detailBg = darkMode ? "#1f2937" : "#f3f4f6";
  const headerMutedColor = darkMode ? "#9CA3AF" : "#4B5563";
  const emptyCellBg = darkMode ? "rgba(31,41,55,0.35)" : "rgba(243,244,246,0.9)";

  return (
    <View
      className={`rounded-lg p-4 shadow-lg mb-4 ${cardBgClass}`}
      style={[styles.card, { backgroundColor: cardBgColor, shadowColor: cardShadowColor }]}
    >
      <Text
        className={`font-semibold text-base ${textPrimary}`}
        style={[styles.titleText, { color: darkMode ? "#F9FAFB" : "#111827" }]}
      >
        Mapa de calor semanal
      </Text>
      <View
        className="flex-row rounded-full overflow-hidden bg-black/5 mt-2"
        style={[styles.toggleGroup, { backgroundColor: toggleInactiveBg }]}
      >
        {["gastos", "ingresos"].map((mode) => {
          const isSelected = chartHeatmapMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              className={`flex-1 justify-center ${
                isSelected ? (darkMode ? "bg-indigo-500" : "bg-blue-500") : ""
              }`}
              style={[styles.toggleButton, isSelected && { backgroundColor: darkMode ? "#4338CA" : "#2563EB" }]}
              onPress={() => setChartHeatmapMode(mode)}
            >
              <Text
                className={isSelected ? "text-white font-semibold" : textPrimary}
                style={[styles.toggleLabel, { color: isSelected ? "#ffffff" : toggleInactiveText }]}
              >
                {mode === "gastos" ? "Gastos" : "Ingresos"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.gridScroll}
        contentContainerStyle={styles.gridContent}
      >
        <View>
          <View className="flex-row" style={styles.headerRow}>
            {AMOUNT_BUCKETS.map((bucket, index) => (
              <View
                key={`heatmap-header-${index}`}
                className="items-center"
                style={styles.bucketHeader}
              >
                <Text
                  className={`${textMuted} text-xs text-center`}
                  style={[styles.bucketLabel, { color: headerMutedColor }]}
                >
                  {bucket.label}
                </Text>
              </View>
            ))}
          </View>
          {heatmapMatrix.map((row, weekdayIdx) => {
            const weekdayLabel = WEEKDAY_LABELS[weekdayIdx];
            const selectedRow = selectedHeatmapCell?.row === weekdayIdx;
            return (
              <View
                key={`heatmap-row-${weekdayIdx}`}
                className="flex-row items-center"
                style={styles.heatmapRow}
              >
                <TouchableOpacity
                  className="justify-center"
                  style={styles.dayLabelButton}
                  onPress={() =>
                    setSelectedHeatmapCell((prev) =>
                      prev && prev.row === weekdayIdx ? null : { row: weekdayIdx, col: -1, value: 0 }
                    )
                  }
                >
                  <Text
                    className={`${textPrimary} text-sm`}
                    style={[styles.dayLabel, { color: darkMode ? "#F9FAFB" : "#111827" }]}
                  >
                    {weekdayLabel}
                  </Text>
                </TouchableOpacity>
                {row.map((value, bucketIdx) => {
                  const ratio = heatmapMax ? value / heatmapMax : 0;
                  const baseColor = chartHeatmapMode === "gastos" ? "239,68,68" : "59,130,246";
                  const backgroundColor =
                    ratio <= 0 ? emptyCellBg : `rgba(${baseColor}, ${0.25 + ratio * 0.6})`;
                  const isSelectedCell =
                    selectedHeatmapCell?.row === weekdayIdx && selectedHeatmapCell?.col === bucketIdx;
                  return (
                    <TouchableOpacity
                      key={`heatmap-cell-${weekdayIdx}-${bucketIdx}`}
                      style={[
                        styles.cell,
                        {
                          backgroundColor,
                          borderWidth: isSelectedCell ? 2 : selectedRow ? 1 : 0,
                          borderColor: isSelectedCell
                            ? chartHeatmapMode === "gastos"
                              ? COLOR_GASTOS
                              : COLOR_INGRESOS
                            : "transparent",
                        },
                      ]}
                      onPress={() =>
                        setSelectedHeatmapCell((prev) =>
                          prev && prev.row === weekdayIdx && prev.col === bucketIdx
                            ? null
                            : { row: weekdayIdx, col: bucketIdx, value }
                        )
                      }
                    >
                      {value > 0 && (
                        <Text
                          style={[
                            styles.cellValue,
                            { color: ratio > 0.4 ? "#ffffff" : darkMode ? "#e5e7eb" : "#1f2937" },
                          ]}
                        >
                          {Math.round(value)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {selectedHeatmapCell && (
        <View
          className={`mt-3 p-3 rounded-lg ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}
          style={[styles.detailCard, { backgroundColor: detailBg }]}
        >
          <Text
            className={`font-semibold ${textPrimary}`}
            style={{ color: darkMode ? "#F9FAFB" : "#111827" }}
          >
            {WEEKDAY_LABELS[selectedHeatmapCell.row]} · {AMOUNT_BUCKETS[selectedHeatmapCell.col].label}
          </Text>
          <Text className={`${textPrimary} text-sm`} style={{ color: darkMode ? "#E5E7EB" : "#1F2937" }}>
            Total: {formatUsd(selectedHeatmapCell.value)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "600",
  },
  toggleGroup: {
    flexDirection: "row",
    borderRadius: 999,
    padding: 4,
    marginTop: 12,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  gridScroll: {
    marginTop: 16,
  },
  gridContent: {
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    marginLeft: 64,
  },
  bucketHeader: {
    width: 80,
    alignItems: "center",
    marginRight: 4,
  },
  bucketLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  heatmapRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
    marginLeft: 8,
  },
  dayLabelButton: {
    width: 56,
    marginRight: 8,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  cell: {
    width: 80,
    height: 36,
    borderRadius: 8,
    marginRight: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  cellValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailCard: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
  },
});
