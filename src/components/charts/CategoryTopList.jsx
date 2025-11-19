// Presentational component: Top categories list with progress bars
// Contains a mode toggle (Gastos/Ingresos) and list of bars with totals

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

/**
 * @param {Object} props
 * @param {Array<{categoria:string,total:number}>} props.categoryChartData
 * @param {number|null} props.selectedCategoryIndex
 * @param {(i:number|null)=>void} props.setSelectedCategoryIndex
 * @param {number} props.categoryMaxValue
 * @param {"gastos"|"ingresos"} props.chartCategoryMode
 * @param {(m:"gastos"|"ingresos")=>void} props.setChartCategoryMode
 * @param {string} props.cardBgClass
 * @param {string} props.textPrimary
 * @param {string} props.textMuted
 * @param {string} props.barTrackClass
 * @param {boolean} props.darkMode
 * @param {string} props.COLOR_GASTOS
 * @param {string} props.COLOR_INGRESOS
 * @param {(n:number)=>string} props.formatUsd
 */
export default function CategoryTopList({
  categoryChartData,
  selectedCategoryIndex,
  setSelectedCategoryIndex,
  categoryMaxValue,
  chartCategoryMode,
  setChartCategoryMode,
  cardBgClass,
  textPrimary,
  textMuted,
  barTrackClass,
  darkMode,
  COLOR_GASTOS,
  COLOR_INGRESOS,
  formatUsd,
}) {
  const cardBgColor = darkMode ? "#111827" : "#ffffff";
  const cardShadowColor = darkMode ? "#000000" : "#0f172a";
  const toggleInactiveBg = darkMode ? "#1f2937" : "#e5e7eb";
  const toggleActiveBg = darkMode ? "#4338CA" : "#2563EB";
  const toggleInactiveText = darkMode ? "#e5e7eb" : "#1f2937";
  const trackBg = darkMode ? "#374151" : "#e5e7eb";
  const detailBg = darkMode ? "#1f2937" : "#f3f4f6";

  return (
    <View
      className={`rounded-lg p-4 shadow-lg mb-4 ${cardBgClass}`}
      style={[
        styles.card,
        {
          backgroundColor: cardBgColor,
          shadowColor: cardShadowColor,
          width: "100%",
        },
      ]}
    >
      <Text
        className={`font-semibold text-base ${textPrimary}`}
        style={[styles.titleText, { color: darkMode ? "#F9FAFB" : "#111827" }]}
      >
        Categorías destacadas
      </Text>
      <View
        className="flex-row rounded-full overflow-hidden bg-black/5 mt-2"
        style={[styles.toggleGroup, { backgroundColor: toggleInactiveBg }]}
      >
        {['gastos', 'ingresos'].map((mode) => {
          const isSelected = chartCategoryMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              className={`flex-1 justify-center px-3 py-1 ${
                isSelected ? (darkMode ? "bg-indigo-500" : "bg-blue-500") : ""
              }`}
              style={[
                styles.toggleButton,
                {
                  backgroundColor: isSelected ? toggleActiveBg : "transparent",
                },
              ]}
              onPress={() => setChartCategoryMode(mode)}
            >
              <Text
                className={isSelected ? "text-white font-semibold" : textPrimary}
                style={{
                  color: isSelected ? "#ffffff" : toggleInactiveText,
                  fontWeight: isSelected ? "600" : "500",
                }}
              >
                {mode === "gastos" ? "Gastos" : "Ingresos"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {categoryChartData.length === 0 ? (
        <Text className={textMuted} style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}>
          Sin registros en este modo.
        </Text>
      ) : (
        categoryChartData.map((item, index) => {
          const isSelected = selectedCategoryIndex === index;
          const pct = categoryMaxValue ? Math.min(1, (item.total || 0) / categoryMaxValue) : 0;
          return (
            <TouchableOpacity
              key={`cat-chart-${item.categoria}-${index}`}
              className="mb-3"
              onPress={() => setSelectedCategoryIndex((prev) => (prev === index ? null : index))}
            >
              <View className="flex-row items-center mb-1" style={styles.listRow}>
                <Text
                  className={`${textPrimary} flex-1`}
                  style={{ color: darkMode ? "#F9FAFB" : "#111827" }}
                >
                  {item.categoria}
                </Text>
                <Text className={`${textMuted} text-sm`} style={{ color: darkMode ? "#d1d5db" : "#6b7280" }}>
                  {formatUsd(item.total)}
                </Text>
              </View>
              <View
                className={`h-3 rounded-full ${barTrackClass}`}
                style={[styles.progressTrack, { backgroundColor: trackBg }]}
              >
                <View
                  style={{
                    width: `${pct * 100}%`,
                    backgroundColor: chartCategoryMode === "gastos" ? COLOR_GASTOS : COLOR_INGRESOS,
                    height: "100%",
                    borderRadius: 9999,
                    opacity: isSelected ? 1 : 0.8,
                  }}
                />
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {selectedCategoryIndex != null && categoryChartData[selectedCategoryIndex] && (
        <View
          className={`mt-2 p-3 rounded-lg ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}
          style={[styles.detailCard, { backgroundColor: detailBg }]}
        >
          <Text
            className={`font-semibold ${textPrimary}`}
            style={{ color: darkMode ? "#F9FAFB" : "#111827", fontWeight: "700" }}
          >
            {categoryChartData[selectedCategoryIndex].categoria}
          </Text>
          <Text
            className={`${textPrimary} text-sm`}
            style={{ color: darkMode ? "#F9FAFB" : "#111827", marginTop: 4 }}
          >
            Total: {formatUsd(categoryChartData[selectedCategoryIndex].total)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "700",
  },
  toggleGroup: {
    flexDirection: "row",
    borderRadius: 999,
    overflow: "hidden",
    padding: 2,
    flexShrink: 1,
    maxWidth: "100%",
    alignSelf: "flex-start",
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    overflow: "hidden",
  },
  detailCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
  },
});
