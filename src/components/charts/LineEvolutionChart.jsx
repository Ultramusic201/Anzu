// Presentational component: Evolution of expenses and income over time
// Renders title, period toggle (7D/30D/12M) and the SVG line chart
// Receives prepared series (labels, gastos, ingresos) and exposes selection callbacks

import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions, StyleSheet } from "react-native";
import { Svg, Rect, Line, Polyline, Circle } from "react-native-svg";

/**
 * @param {Object} props
 * @param {Object} props.lineChartData - { labels: string[], gastos: number[], ingresos: number[] }
 * @param {"week"|"month"|"year"} props.chartPeriod
 * @param {(p: "week"|"month"|"year")=>void} props.setChartPeriod
 * @param {number|null} props.selectedLineIndex
 * @param {(i:number)=>void} props.setSelectedLineIndex
 * @param {boolean} props.darkMode
 * @param {string} props.textPrimary
 * @param {string} props.textMuted
 * @param {string} props.borderMutedClass
 * @param {string} props.cardBgClass
 * @param {(n:number)=>string} props.formatUsd
 * @param {string} props.COLOR_GASTOS
 * @param {string} props.COLOR_GASTOS_ALT
 * @param {string} props.COLOR_INGRESOS
 * @param {string} props.COLOR_INGRESOS_ALT
 */
export default function LineEvolutionChart({
  lineChartData,
  chartPeriod,
  setChartPeriod,
  selectedLineIndex,
  setSelectedLineIndex,
  darkMode,
  textPrimary,
  textMuted,
  borderMutedClass,
  cardBgClass,
  formatUsd,
  COLOR_GASTOS,
  COLOR_GASTOS_ALT,
  COLOR_INGRESOS,
  COLOR_INGRESOS_ALT,
}) {
  const windowWidth = Dimensions.get("window").width || 360;
  const [cardWidth, setCardWidth] = React.useState(null);
  const handleCardLayout = React.useCallback((event) => {
    const width = event?.nativeEvent?.layout?.width;
    if (width == null) return;
    setCardWidth((prev) => {
      if (prev != null && Math.abs(prev - width) < 1) {
        return prev;
      }
      return width;
    });
  }, []);

  const availableWidth = cardWidth != null ? cardWidth - 40 : windowWidth - 48;
  const chartWidth = Math.max(Math.min(availableWidth, 620), 240);
  const lineChartHeight = 200;
  const lineLabels = lineChartData.labels || [];
  const lineMaxValue = Math.max(
    1,
    ...(lineChartData.gastos || []),
    ...(lineChartData.ingresos || [])
  );
  const lineStep =
    lineLabels.length > 1 ? chartWidth / (lineLabels.length - 1) : chartWidth;
  const lineTopPadding = 16;
  const lineBottomPadding = 20;
  const lineDrawableHeight = lineChartHeight - lineTopPadding - lineBottomPadding;

  const gastosLinePoints = lineLabels.length
    ? (lineChartData.gastos || [])
        .map((value, index) => {
          const x = lineLabels.length > 1 ? lineStep * index : chartWidth / 2;
          const y =
            lineTopPadding +
            (lineDrawableHeight - (value / lineMaxValue) * lineDrawableHeight);
          return `${x},${y}`;
        })
        .join(" ")
    : "";
  const ingresosLinePoints = lineLabels.length
    ? (lineChartData.ingresos || [])
        .map((value, index) => {
          const x = lineLabels.length > 1 ? lineStep * index : chartWidth / 2;
          const y =
            lineTopPadding +
            (lineDrawableHeight - (value / lineMaxValue) * lineDrawableHeight);
          return `${x},${y}`;
        })
        .join(" ")
    : "";

  const lineHighlightX =
    selectedLineIndex != null
      ? lineLabels.length > 1
        ? lineStep * selectedLineIndex
        : chartWidth / 2
      : null;

  const highlightedLinePoint =
    selectedLineIndex != null && lineLabels[selectedLineIndex]
      ? {
          label: lineLabels[selectedLineIndex],
          gastos: lineChartData.gastos[selectedLineIndex] || 0,
          ingresos: lineChartData.ingresos[selectedLineIndex] || 0,
        }
      : null;

  const cardBgColor = darkMode ? "#111827" : "#ffffff";
  const cardShadowColor = darkMode ? "#000000" : "#0f172a";
  const toggleActiveBg = darkMode ? "#4338CA" : "#2563EB";
  const toggleInactiveBorder = darkMode ? "#4B5563" : "#D1D5DB";
  const toggleInactiveText = darkMode ? "#E5E7EB" : "#1F2937";
  const gridColor = darkMode ? "#4b5563" : "#d1d5db";
  const backgroundPanel = darkMode ? "#1f2937" : "#f9fafb";
  const labelPrimary = darkMode ? "#F9FAFB" : "#111827";
  const labelMuted = darkMode ? "#D1D5DB" : "#4B5563";

  return (
    <View
      className={`rounded-lg p-4 shadow-lg mb-4 ${cardBgClass}`}
      style={[
        styles.card,
        {
          backgroundColor: cardBgColor,
          shadowColor: cardShadowColor,
        },
      ]}
      onLayout={handleCardLayout}
    >
      <Text
        className={`font-semibold text-base ${textPrimary}`}
        style={[styles.titleText, { color: labelPrimary }]}
      >
        Evolución de ingresos y gastos
      </Text>
      <View className="flex-row flex-wrap mt-2" style={styles.toggleRow}>
        {["week", "month", "year"].map((option) => {
          const label = option === "week" ? "7D" : option === "month" ? "30D" : "12M";
          const isSelected = chartPeriod === option;
          return (
            <TouchableOpacity
              key={option}
              className={`px-3 py-1 mr-2 mb-2 rounded-full border ${
                isSelected
                  ? darkMode
                    ? "border-indigo-400 bg-indigo-500"
                    : "border-blue-400 bg-blue-500"
                  : borderMutedClass
              }`}
              style={[
                styles.toggleButton,
                {
                  backgroundColor: isSelected ? toggleActiveBg : "transparent",
                  borderColor: isSelected ? toggleActiveBg : toggleInactiveBorder,
                },
              ]}
              onPress={() => setChartPeriod(option)}
            >
              <Text
                className={isSelected ? "text-white font-semibold" : textPrimary}
                style={{
                  color: isSelected ? "#FFFFFF" : toggleInactiveText,
                  fontWeight: isSelected ? "600" : "500",
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {lineLabels.length === 0 ? (
        <Text className={textMuted} style={{ color: labelMuted }}>
          No hay datos suficientes para graficar.
        </Text>
      ) : (
        <>
          <View style={[styles.chartWrapper, { width: chartWidth }]}>
            <Svg width={chartWidth} height={lineChartHeight}>
              <Rect
                x={0}
                y={0}
                width={chartWidth}
                height={lineChartHeight}
                fill={backgroundPanel}
                rx={12}
              />
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = lineTopPadding + ratio * lineDrawableHeight;
                return (
                  <Line
                    key={`grid-${idx}`}
                    x1={0}
                    x2={chartWidth}
                    y1={y}
                    y2={y}
                    stroke={gridColor}
                    strokeDasharray="4 6"
                    strokeWidth={0.5}
                  />
                );
              })}
              {lineHighlightX != null && (
                <Line
                  x1={lineHighlightX}
                  x2={lineHighlightX}
                  y1={lineTopPadding - 4}
                  y2={lineChartHeight - lineBottomPadding + 4}
                  stroke={darkMode ? "#6366f1" : "#2563eb"}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}
              {gastosLinePoints ? (
                <Polyline
                  points={gastosLinePoints}
                  fill="none"
                  stroke={COLOR_GASTOS}
                  strokeWidth={2.5}
                />
              ) : null}
              {ingresosLinePoints ? (
                <Polyline
                  points={ingresosLinePoints}
                  fill="none"
                  stroke={COLOR_INGRESOS}
                  strokeWidth={2.5}
                />
              ) : null}
              {lineLabels.map((label, index) => {
                const gastosValue = lineChartData.gastos[index] || 0;
                const ingresosValue = lineChartData.ingresos[index] || 0;
                const x = lineLabels.length > 1 ? lineStep * index : chartWidth / 2;
                const gastosY =
                  lineTopPadding +
                  (lineDrawableHeight - (gastosValue / lineMaxValue) * lineDrawableHeight);
                const ingresosY =
                  lineTopPadding +
                  (lineDrawableHeight - (ingresosValue / lineMaxValue) * lineDrawableHeight);
                const selected = selectedLineIndex === index;
                return (
                  <React.Fragment key={`line-point-pair-${index}`}>
                    <Circle
                      cx={x}
                      cy={gastosY}
                      r={selected ? 5 : 4}
                      fill={selected ? COLOR_GASTOS : COLOR_GASTOS_ALT}
                    />
                    <Circle
                      cx={x}
                      cy={ingresosY}
                      r={selected ? 5 : 4}
                      fill={selected ? COLOR_INGRESOS : COLOR_INGRESOS_ALT}
                    />
                  </React.Fragment>
                );
              })}
            </Svg>
          </View>

          <View style={styles.labelsWrap}>
            {lineLabels.map((label, index) => {
              const isSelected = selectedLineIndex === index;
              return (
                <TouchableOpacity
                  key={`line-label-${label}-${index}`}
                  className={`px-3 py-1 mr-2 rounded-full border ${
                    isSelected
                      ? darkMode
                        ? "border-indigo-400 bg-indigo-500"
                        : "border-blue-400 bg-blue-500"
                      : borderMutedClass
                  }`}
                  style={[
                    styles.labelPill,
                    {
                      backgroundColor: isSelected ? toggleActiveBg : "transparent",
                      borderColor: isSelected ? toggleActiveBg : toggleInactiveBorder,
                    },
                  ]}
                  onPress={() => setSelectedLineIndex(index)}
                >
                  <Text
                    className={isSelected ? "text-white" : textPrimary}
                    style={{ color: isSelected ? "#FFFFFF" : labelPrimary }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="flex-row items-center justify-between mt-2" style={styles.legendRow}>
            <View className="flex-row items-center" style={styles.legendItem}>
              <View
                style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: COLOR_GASTOS }}
              />
              <Text
                className={`${textPrimary} ml-2 text-sm`}
                style={{ color: labelPrimary, marginLeft: 8, fontSize: 13 }}
              >
                Gastos
              </Text>
            </View>
            <View className="flex-row items-center" style={styles.legendItem}>
              <View
                style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: COLOR_INGRESOS }}
              />
              <Text
                className={`${textPrimary} ml-2 text-sm`}
                style={{ color: labelPrimary, marginLeft: 8, fontSize: 13 }}
              >
                Ingresos
              </Text>
            </View>
          </View>

          {highlightedLinePoint && (
            <View
              className={`mt-3 p-3 rounded-lg ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}
              style={[styles.detailCard, { backgroundColor: darkMode ? "#1f2937" : "#f3f4f6" }]}
            >
              <Text
                className={`font-semibold mb-1 ${textPrimary}`}
                style={{ color: labelPrimary, fontWeight: "700" }}
              >
                {highlightedLinePoint.label}
              </Text>
              <Text
                className={`${textPrimary} text-sm`}
                style={{ color: labelPrimary, marginBottom: 4 }}
              >
                Gastos: {formatUsd(highlightedLinePoint.gastos)}
              </Text>
              <Text className={`${textPrimary} text-sm`} style={{ color: labelPrimary }}>
                Ingresos: {formatUsd(highlightedLinePoint.ingresos)}
              </Text>
            </View>
          )}
        </>
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
    width: "100%",
    alignSelf: "stretch",
  },
  titleText: {
    fontSize: 18,
    fontWeight: "700",
  },
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  chartWrapper: {
    alignItems: "center",
    marginTop: 12,
    width: "100%",
    overflow: "hidden",
  },
  labelsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  labelPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
});
