import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { openDatabaseAsync } from "expo-sqlite";
import { Ionicons } from "@expo/vector-icons";
import { Svg, G, Path, Circle } from "react-native-svg";

// Utilidades de fecha sin dependencias
const pad2 = (n) => String(n).padStart(2, "0");
const formatYMD = (date) => {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
};
const formatYM = (date) => {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  return `${y}-${m}`;
};

const startOfWeek = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
};

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const CATEGORIES = [
  "COMIDA",
  "COMIDA CHATARRA",
  "SERVICIOS",
  "JUEGOS",
  "OCIO",
  "SALUD",
  "PERSONAS",
  "ROPA",
  "AHORRO",
  "CRIPTO",
  "DEUDAS",
  "CREDITOS",
];

export default function App() {
  const [tasaDolar, setTasaDolar] = useState("");
  const [showTasaModal, setShowTasaModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    tipo: "Gasto",
    descripcion: "",
    monto: "",
    moneda: "VES",
    categoria: "COMIDA",
  });
  const [currentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(formatYM(currentDate));
  const [viewMode, setViewMode] = useState("month");
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(currentDate)
  );
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [db, setDb] = useState(null);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [tempYear, setTempYear] = useState(currentDate.getFullYear());
  const [tempMonthIndex, setTempMonthIndex] = useState(currentDate.getMonth());
  const [darkMode, setDarkMode] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [categoryMax, setCategoryMax] = useState(0);
  const [activeView, setActiveView] = useState("home");
  const [showDrawer, setShowDrawer] = useState(false);
  const [limitsByCategory, setLimitsByCategory] = useState({});
  const [txFilter, setTxFilter] = useState("todo");

  useEffect(() => {
    (async () => {
      try {
        const database = await openDatabaseAsync("expense_tracker.db");
        setDb(database);
        await initializeDB(database);
        await checkTasaDia(database);
        await loadLimits(database);
        await loadTransactions(database);
        await loadCategoryTotals(database);
        setBootstrapping(false);
      } catch (e) {
        console.error("[DB bootstrap] error", e);
        setBootstrapping(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!db || bootstrapping) return;
    (async () => {
      await loadTransactions(db);
      await loadCategoryTotals(db);
    })();
  }, [
    currentMonth,
    currentWeekStart,
    currentYear,
    viewMode,
    db,
    bootstrapping,
  ]);

  const ensureCategoriaColumn = async (database) => {
    try {
      const cols = await database.getAllAsync(
        "PRAGMA table_info(transacciones)"
      );
      const has = cols.some((c) => c.name === "categoria");
      if (!has) {
        await database.execAsync(
          "ALTER TABLE transacciones ADD COLUMN categoria TEXT;"
        );
      }
    } catch (e) {
      console.error("[DB ensureCategoriaColumn] error", e);
    }
  };

  const buildEmptyLimits = () => {
    const m = {};
    CATEGORIES.forEach((c) => {
      m[c] = { diario: "", semanal: "", mensual: "" };
    });
    return m;
  };

  const loadLimits = async (database = db) => {
    if (!database) return;
    try {
      const rows = await database.getAllAsync(
        "SELECT categoria, periodo, monto_usd FROM limites"
      );
      const base = buildEmptyLimits();
      rows.forEach((r) => {
        if (!base[r.categoria]) return;
        const val = r.monto_usd != null ? String(r.monto_usd) : "";
        if (
          r.periodo === "diario" ||
          r.periodo === "semanal" ||
          r.periodo === "mensual"
        ) {
          base[r.categoria][r.periodo] = val;
        }
      });
      setLimitsByCategory(base);
    } catch (e) {
      console.error("[DB loadLimits] error", e);
      setLimitsByCategory(buildEmptyLimits());
    }
  };

  const saveLimits = async () => {
    const errs = [];
    CATEGORIES.forEach((cat) => {
      const v = limitsByCategory[cat] || {};
      const d = v.diario !== "" ? parseFloat(v.diario) : null;
      const s = v.semanal !== "" ? parseFloat(v.semanal) : null;
      const m = v.mensual !== "" ? parseFloat(v.mensual) : null;
      if (Number.isNaN(d) || Number.isNaN(s) || Number.isNaN(m)) {
        errs.push(cat);
        return;
      }
      if (d != null && s != null && d > s) errs.push(cat);
      if (d != null && m != null && d > m) errs.push(cat);
      if (s != null && m != null && s > m) errs.push(cat);
    });
    if (errs.length > 0) {
      Alert.alert(
        "Error",
        "Revise los límites. Diario ≤ Semanal ≤ Mensual por categoría."
      );
      return;
    }
    if (!db) return;
    try {
      await db.withTransactionAsync(async () => {
        for (const cat of CATEGORIES) {
          const v = limitsByCategory[cat] || {};
          const entries = [
            { p: "diario", val: v.diario },
            { p: "semanal", val: v.semanal },
            { p: "mensual", val: v.mensual },
          ];
          for (const e of entries) {
            const has = e.val !== "" && !Number.isNaN(parseFloat(e.val));
            if (has) {
              await db.runAsync(
                "INSERT INTO limites (categoria, periodo, monto_usd) VALUES (?, ?, ?) ON CONFLICT(categoria, periodo) DO UPDATE SET monto_usd = excluded.monto_usd",
                [cat, e.p, parseFloat(e.val)]
              );
            } else {
              await db.runAsync(
                "DELETE FROM limites WHERE categoria = ? AND periodo = ?",
                [cat, e.p]
              );
            }
          }
        }
      });
      Alert.alert("Éxito", "Límites guardados");
      await loadLimits();
    } catch (e) {
      console.error("[DB saveLimits] error", e);
      Alert.alert("Error", "No se pudieron guardar los límites");
    }
  };

  useEffect(() => {
    if (!db) return;
    if (activeView === "limits") {
      loadLimits(db);
    }
  }, [activeView, db]);

  const ensureTasaColumn = async (database) => {
    try {
      const cols = await database.getAllAsync(
        "PRAGMA table_info(transacciones)"
      );
      const has = cols.some((c) => c.name === "tasa_ves_a_usd");
      if (!has) {
        await database.execAsync(
          "ALTER TABLE transacciones ADD COLUMN tasa_ves_a_usd REAL;"
        );
      }
    } catch (e) {
      console.error("[DB ensureTasaColumn] error", e);
    }
  };

  const initializeDB = async (database = db) => {
    if (!database) return;
    try {
      await database.withTransactionAsync(async () => {
        await database.execAsync(
          "CREATE TABLE IF NOT EXISTS tasas_diarias (id INTEGER PRIMARY KEY AUTOINCREMENT, fecha TEXT UNIQUE, tasa_ves_a_usd REAL);"
        );
        await database.execAsync(
          "CREATE TABLE IF NOT EXISTS transacciones (id INTEGER PRIMARY KEY AUTOINCREMENT, fecha TEXT, tipo TEXT, descripcion TEXT, monto_original REAL, moneda_original TEXT, monto_usd_registro REAL, monto_ves_registro REAL, categoria TEXT, tasa_ves_a_usd REAL);"
        );
        await database.execAsync(
          "CREATE TABLE IF NOT EXISTS limites (id INTEGER PRIMARY KEY AUTOINCREMENT, categoria TEXT, periodo TEXT, monto_usd REAL, UNIQUE(categoria, periodo));"
        );
      });
      await ensureCategoriaColumn(database);
      await ensureTasaColumn(database);
    } catch (e) {
      console.error("[DB initializeDB] error", e);
    }
  };

  const checkTasaDia = async (database = db) => {
    if (!database) return;
    try {
      const today = formatYMD(new Date());
      const rows = await database.getAllAsync(
        "SELECT * FROM tasas_diarias WHERE fecha = ?",
        [today]
      );
      if (rows.length === 0) {
        setShowTasaModal(true);
      } else {
        setTasaDolar(rows[0].tasa_ves_a_usd.toString());
      }
    } catch (e) {
      console.error("[DB checkTasaDia] error", e);
    }
  };

  const guardarTasaDia = async () => {
    if (
      !tasaDolar ||
      isNaN(parseFloat(tasaDolar)) ||
      parseFloat(tasaDolar) <= 0
    ) {
      Alert.alert("Error", "Por favor ingrese una tasa válida");
      return;
    }

    if (!db) return;
    try {
      const today = formatYMD(new Date());
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "INSERT OR REPLACE INTO tasas_diarias (fecha, tasa_ves_a_usd) VALUES (?, ?)",
          [today, parseFloat(tasaDolar)]
        );
      });
      setShowTasaModal(false);
      await loadTransactions();
    } catch (e) {
      console.error("[DB guardarTasaDia] error", e);
    }
  };

  const getPeriodRange = () => {
    try {
      const todayStr = formatYMD(new Date());
      if (viewMode === "month") {
        const ym =
          typeof currentMonth === "string"
            ? currentMonth
            : formatYM(new Date());
        const [year, month] = ym.split("-");
        if (!year || !month) return { startDate: todayStr, endDate: todayStr };
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-31`;
        return { startDate, endDate };
      } else if (viewMode === "year") {
        const y = Number.isFinite(currentYear)
          ? currentYear
          : new Date().getFullYear();
        return { startDate: `${y}-01-01`, endDate: `${y}-12-31` };
      } else if (viewMode === "week") {
        const s =
          currentWeekStart instanceof Date
            ? currentWeekStart
            : startOfWeek(new Date());
        const e = new Date(s);
        e.setDate(s.getDate() + 6);
        return { startDate: formatYMD(s), endDate: formatYMD(e) };
      }
      return { startDate: todayStr, endDate: todayStr };
    } catch (_e) {
      const todayStr = formatYMD(new Date());
      return { startDate: todayStr, endDate: todayStr };
    }
  };

  const loadTransactions = async (database = db) => {
    const { startDate, endDate } = getPeriodRange();

    if (!database) return;
    try {
      if (!startDate || !endDate) {
        console.warn("[DB loadTransactions] invalid period", {
          viewMode,
          startDate,
          endDate,
        });
        return;
      }
      // debug
      console.log("[DB loadTransactions] period", {
        viewMode,
        startDate,
        endDate,
      });
      const rows = await database.getAllAsync(
        "SELECT * FROM transacciones WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC",
        [startDate, endDate]
      );
      setTransactions(rows);
      console.log(
        "[DB loadTransactions] rows",
        rows.length,
        rows[0]
          ? {
              id: rows[0].id,
              fecha: rows[0].fecha,
              tipo: rows[0].tipo,
              categoria: rows[0].categoria,
            }
          : {}
      );
    } catch (e) {
      console.error("[DB loadTransactions] error", e);
      try {
        const rows = await database.getAllAsync(
          "SELECT * FROM transacciones ORDER BY fecha DESC LIMIT 200"
        );
        setTransactions(rows);
        console.log("[DB loadTransactions fallback] rows", rows.length);
      } catch (e2) {
        console.error("[DB loadTransactions fallback] error", e2);
      }
    }
  };

  const loadCategoryTotals = async (database = db) => {
    const { startDate, endDate } = getPeriodRange();
    if (!database) return;
    try {
      if (!startDate || !endDate) {
        console.warn("[DB loadCategoryTotals] invalid period", {
          viewMode,
          startDate,
          endDate,
        });
        return;
      }
      // debug
      console.log("[DB loadCategoryTotals] period", {
        viewMode,
        startDate,
        endDate,
      });
      const rows = await database.getAllAsync(
        "SELECT COALESCE(categoria, 'SIN CATEGORIA') as categoria, SUM(monto_ves_registro) as total_ves, SUM(monto_usd_registro) as total_usd FROM transacciones WHERE fecha BETWEEN ? AND ? AND tipo = 'Gasto' GROUP BY COALESCE(categoria, 'SIN CATEGORIA')",
        [startDate, endDate]
      );
      // Normalize numbers and sort desc
      const data = rows
        .map((r) => ({
          categoria: r.categoria,
          totalVES: Number(r.total_ves || 0),
          totalUSD: Number(r.total_usd || 0),
        }))
        .sort((a, b) => b.totalVES - a.totalVES);
      setCategoryTotals(data);
      setCategoryMax(
        data.length ? Math.max(...data.map((d) => d.totalVES)) : 0
      );
    } catch (e) {
      console.error("[DB loadCategoryTotals] error", e);
      setCategoryTotals([]);
      setCategoryMax(0);
    }
  };

  const agregarTransaccion = async () => {
    if (
      !newTransaction.descripcion ||
      !newTransaction.monto ||
      isNaN(parseFloat(newTransaction.monto))
    ) {
      Alert.alert("Error", "Por favor complete todos los campos correctamente");
      return;
    }

    const today = formatYMD(new Date());
    const monto = parseFloat(newTransaction.monto);
    const rate = parseFloat(tasaDolar);
    if (!Number.isFinite(rate) || rate <= 0) {
      Alert.alert(
        "Error",
        "Debe establecer una tasa válida del día antes de guardar"
      );
      setShowTasaModal(true);
      return;
    }
    let montoUsd = 0;
    let montoVes = 0;

    if (newTransaction.moneda === "USD") {
      montoUsd = monto;
      montoVes = monto * rate;
    } else {
      montoVes = monto;
      montoUsd = monto / rate;
    }
    if (!db) return;
    try {
      if (
        !Number.isFinite(montoUsd) ||
        !Number.isFinite(montoVes) ||
        !Number.isFinite(monto)
      ) {
        Alert.alert(
          "Error",
          "Los montos calculados no son válidos. Revise los datos e intente de nuevo."
        );
        return;
      }
      const categoriaParam =
        newTransaction.tipo === "Ingreso"
          ? null
          : newTransaction.categoria || "SIN CATEGORIA";
      console.log("[DB agregarTransaccion] params", {
        fecha: today,
        tipo: newTransaction.tipo,
        descripcion: newTransaction.descripcion,
        monto_original: monto,
        moneda_original: newTransaction.moneda,
        monto_usd_registro: montoUsd,
        monto_ves_registro: montoVes,
        categoria: categoriaParam,
        tasa_ves_a_usd: rate,
      });
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "INSERT INTO transacciones (fecha, tipo, descripcion, monto_original, moneda_original, monto_usd_registro, monto_ves_registro, categoria, tasa_ves_a_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            today,
            newTransaction.tipo,
            newTransaction.descripcion,
            monto,
            newTransaction.moneda,
            montoUsd,
            montoVes,
            categoriaParam,
            rate,
          ]
        );
      });
      setNewTransaction({
        tipo: "Gasto",
        descripcion: "",
        monto: "",
        moneda: "VES",
        categoria: "COMIDA",
      });
      setShowAddModal(false);
      await loadTransactions();
      await loadCategoryTotals();
    } catch (e) {
      console.error("[DB agregarTransaccion] error", e);
    }
  };

  const monthLabel = (ym) => {
    const [y, m] = ym.split("-").map(Number);
    return `${MONTHS[m - 1]} ${y}`;
  };

  const changeMonth = (delta) => {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCurrentMonth(formatYM(d));
  };

  const calcularTotales = () => {
    let ingresosVES = 0;
    let gastosVES = 0;
    let ingresosUSD = 0;
    let gastosUSD = 0;

    transactions.forEach((trans) => {
      if (trans.tipo === "Ingreso") {
        ingresosVES += trans.monto_ves_registro;
        ingresosUSD += trans.monto_usd_registro;
      } else {
        gastosVES += trans.monto_ves_registro;
        gastosUSD += trans.monto_usd_registro;
      }
    });

    return {
      ingresosVES: ingresosVES.toFixed(2),
      gastosVES: gastosVES.toFixed(2),
      balanceVES: (ingresosVES - gastosVES).toFixed(2),
      ingresosUSD: ingresosUSD.toFixed(2),
      gastosUSD: gastosUSD.toFixed(2),
      balanceUSD: (ingresosUSD - gastosUSD).toFixed(2),
    };
  };

  const totales = calcularTotales();
  const screenBgClass = darkMode ? "bg-gray-900" : "bg-gray-100";
  const headerBgClass = darkMode ? "bg-gray-900" : "bg-sky-600";
  const cardBgClass = darkMode ? "bg-gray-800" : "bg-white";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textMuted = darkMode ? "text-gray-300" : "text-gray-500";
  const modalBgClass = darkMode ? "bg-gray-800" : "bg-white";
  const accentBtnClass = darkMode ? "bg-indigo-500" : "bg-blue-500";
  const borderMutedClass = darkMode ? "border-gray-700" : "border-gray-200";
  const inputBgClass = darkMode ? "bg-gray-900" : "bg-white";
  const inputBorderClass = darkMode ? "border-gray-600" : "border-gray-300";
  const inputTextClass = darkMode ? "text-white" : "text-gray-900";
  const placeholderColor = darkMode ? "#9CA3AF" : "#6B7280";
  const chipSelectedBgBorder = darkMode
    ? "bg-indigo-900 border-indigo-500"
    : "bg-blue-100 border-blue-500";
  const chipSelectedText = darkMode ? "text-indigo-100" : "text-blue-700";
  const chipUnselectedBgBorder = darkMode
    ? "bg-gray-800 border-gray-600"
    : "bg-gray-100 border-gray-300";
  const chipUnselectedText = darkMode ? "text-gray-300" : "text-gray-700";
  const minorBtnBgClass = darkMode ? "bg-gray-700" : "bg-gray-300";
  const smallBtnBgClass = darkMode ? "bg-gray-700" : "bg-gray-100";
  const barTrackClass = darkMode ? "bg-gray-700" : "bg-gray-200";
  const barFillClass = darkMode ? "bg-indigo-500" : "bg-blue-500";
  const warnBgClass = darkMode
    ? "bg-red-900 border-red-700"
    : "bg-red-50 border-red-200";
  const warnTextClass = darkMode ? "text-red-200" : "text-red-700";

  // Pie chart helpers and data
  const totalGastosVES = categoryTotals.reduce((s, d) => s + d.totalVES, 0);
  const totalGastosUSD = categoryTotals.reduce((s, d) => s + (d.totalUSD || 0), 0);
  const pieColors = [
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#84cc16",
    "#f97316",
    "#06b6d4",
  ];

  const CATEGORY_COLOR_MAP = {
    COMIDA: "#ef4444",
    "COMIDA CHATARRA": "#f59e0b",
    SERVICIOS: "#10b981",
    JUEGOS: "#3b82f6",
    OCIO: "#8b5cf6",
    SALUD: "#ec4899",
    PERSONAS: "#14b8a6",
    ROPA: "#84cc16",
    AHORRO: "#f97316",
    CRIPTO: "#06b6d4",
    DEUDAS: "#b91c1c",
    CREDITOS: "#2563eb",
    "SIN CATEGORIA": "#9ca3af",
    INGRESO: "#16a34a",
  };
  const CATEGORY_ICON_MAP = {
    COMIDA: "fast-food",
    "COMIDA CHATARRA": "pizza",
    SERVICIOS: "construct",
    JUEGOS: "game-controller",
    OCIO: "beer",
    SALUD: "medkit",
    PERSONAS: "people",
    ROPA: "shirt",
    AHORRO: "wallet",
    CRIPTO: "cash",
    DEUDAS: "trending-down",
    CREDITOS: "card",
    "SIN CATEGORIA": "pricetag",
    INGRESO: "trending-up",
  };
  const getCategoryColor = (cat, tipo) =>
    CATEGORY_COLOR_MAP[
      cat ?? (tipo === "Ingreso" ? "INGRESO" : "SIN CATEGORIA")
    ] || "#6b7280";
  const getCategoryIcon = (cat, tipo) =>
    CATEGORY_ICON_MAP[
      cat ?? (tipo === "Ingreso" ? "INGRESO" : "SIN CATEGORIA")
    ] || "pricetag";

  const polarToCartesian = (cx, cy, r, angle) => {
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };
  const arcPath = (cx, cy, r, start, end) => {
    const startP = polarToCartesian(cx, cy, r, start);
    const endP = polarToCartesian(cx, cy, r, end);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${startP.x} ${startP.y} A ${r} ${r} 0 ${largeArc} 1 ${endP.x} ${endP.y} Z`;
  };
  const arcStroke = (cx, cy, r, start, end) => {
    const startP = polarToCartesian(cx, cy, r, start);
    const endP = polarToCartesian(cx, cy, r, end);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return `M ${startP.x} ${startP.y} A ${r} ${r} 0 ${largeArc} 1 ${endP.x} ${endP.y}`;
  };

  const donutSegmentPath = (cx, cy, rOuter, rInner, start, end) => {
    const largeArc = end - start > Math.PI ? 1 : 0;
    const oStart = polarToCartesian(cx, cy, rOuter, start);
    const oEnd = polarToCartesian(cx, cy, rOuter, end);
    const iEnd = polarToCartesian(cx, cy, rInner, end);
    const iStart = polarToCartesian(cx, cy, rInner, start);
    return [
      `M ${oStart.x} ${oStart.y}`,
      `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${oEnd.x} ${oEnd.y}`,
      `L ${iEnd.x} ${iEnd.y}`,
      `A ${rInner} ${rInner} 0 ${largeArc} 0 ${iStart.x} ${iStart.y}`,
      'Z',
    ].join(' ');
  };

  const cx = 110,
    cy = 110,
    radius = 90;
  const donutThickness = 20;
  const donutTrackColor = darkMode ? "#374151" : "#e5e7eb";
  const donutCenterFill = darkMode ? "#1f2937" : "#ffffff"; // matches card bg
  const svgTextColor = darkMode ? "#ffffff" : "#111827";
  const ringInnerR = radius - donutThickness; // inner radius of ring
  const centerR = ringInnerR - 4; // center fill smaller than inner ring
  const baseGapRad = (Math.PI / 180) * 1.2; // ~1.2° base, ajustable
  let startAngle = -Math.PI / 2; // start at top
  const pieSegments = [];
  if (totalGastosVES > 0) {
    const chartCategories = categoryTotals.slice(0, 8).filter(r => r.totalVES > 0);
    const n = chartCategories.length;
    if (n > 0) {
      const sumTop = chartCategories.reduce((s, r) => s + r.totalVES, 0);
      const gap = baseGapRad;
      const full = Math.PI * 2;
      const available = Math.max(0, full - n * gap);
      const baseAngles = chartCategories.map(r => (sumTop > 0 ? (r.totalVES / sumTop) * available : 0));
      const minAngle = (Math.PI / 180) * 2; // 2° mínimo
      let angles = baseAngles.map(a => Math.max(a, minAngle));
      let over = angles.reduce((s, a) => s + a, 0) - available;
      if (over > 1e-6) {
        // Reducir proporcionalmente sobre los que superan el mínimo
        const adjustableIdx = angles.map((a, i) => (a > minAngle ? i : -1)).filter(i => i >= 0);
        let adjustableSum = adjustableIdx.reduce((s, i) => s + (angles[i] - minAngle), 0);
        if (adjustableSum > 0) {
          adjustableIdx.forEach(i => {
            const reducible = angles[i] - minAngle;
            const delta = over * (reducible / adjustableSum);
            angles[i] = Math.max(minAngle, angles[i] - delta);
          });
        }
      }

      let aStart = -Math.PI / 2;
      chartCategories.forEach((row, idx) => {
        const aSpan = angles[idx];
        const aEnd = aStart + aSpan;
        const adjStart = aStart + gap / 2;
        const adjEnd = aEnd - gap / 2;
        if (adjEnd > adjStart) {
          pieSegments.push({
            d: donutSegmentPath(cx, cy, radius, ringInnerR, adjStart, adjEnd),
            color: pieColors[idx % pieColors.length],
            key: `${row.categoria}-${idx}`,
            pct: (totalGastosVES > 0 ? (row.totalVES / totalGastosVES) * 100 : 0),
            label: row.categoria,
            usd: row.totalUSD,
          });
        }
        aStart = aEnd;
      });
    }
  }

  const formatearFecha = (fechaStr) => {
    const [y, m, d] = fechaStr.split("-").map(Number);
    const fecha = new Date(y, m - 1, d);
    return fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getPeriodLimitSumUSD = () => {
    const key =
      viewMode === "week" ? "semanal" : viewMode === "month" ? "mensual" : null;
    if (!key) return 0;
    let sum = 0;
    for (const cat of CATEGORIES) {
      const v = limitsByCategory[cat];
      if (v && v[key] !== "") {
        const n = parseFloat(v[key]);
        if (!Number.isNaN(n)) sum += n;
      }
    }
    return sum;
  };
  const limitSumUSD = getPeriodLimitSumUSD();
  const gastosUSDNumber = parseFloat(totales.gastosUSD || "0");
  const getExceededCategories = () => {
    const key =
      viewMode === "week" ? "semanal" : viewMode === "month" ? "mensual" : null;
    if (!key) return [];
    const exceeded = [];
    for (const row of categoryTotals) {
      const limStr = limitsByCategory[row.categoria]?.[key];
      if (limStr == null || limStr === "") continue;
      const lim = parseFloat(limStr);
      if (!Number.isNaN(lim) && row.totalUSD > lim)
        exceeded.push(row.categoria);
    }
    return exceeded;
  };
  const exceededCategories = getExceededCategories();
  const exceededLimit = exceededCategories.length > 0;
  const limitName =
    viewMode === "week"
      ? "SEMANAL"
      : viewMode === "month"
      ? "MENSUAL"
      : "DIARIO";

  const periodLabel = () => {
    if (viewMode === "month") return monthLabel(currentMonth);
    if (viewMode === "year") return `Año ${currentYear}`;
    if (viewMode === "week") {
      const s = currentWeekStart;
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      return `Semana ${formatearFecha(formatYMD(s))} - ${formatearFecha(
        formatYMD(e)
      )}`;
    }
    return "";
  };

  const changePeriod = (delta) => {
    if (viewMode === "month") {
      changeMonth(delta);
    } else if (viewMode === "year") {
      setCurrentYear((y) => y + delta);
    } else {
      setCurrentWeekStart((d) => {
        const nd = new Date(d);
        nd.setDate(nd.getDate() + delta * 7);
        return nd;
      });
    }
  };

  const filteredTransactions =
    txFilter === "todo"
      ? transactions
      : transactions.filter((t) =>
          txFilter === "gastos" ? t.tipo !== "Ingreso" : t.tipo === "Ingreso"
        );

  return (
    <SafeAreaView className={`flex-1 ${screenBgClass}`}>
      <StatusBar
        style="light"
        backgroundColor={darkMode ? "#111827" : "#0284C7"}
      />

      <View className={`${headerBgClass} p-4`}>
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            className="px-3 py-1 rounded bg-white/20"
            onPress={() => setShowDrawer(true)}
          >
            <Ionicons name="menu" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            className="px-3 py-1 rounded bg-white/20"
            onPress={() => setDarkMode(!darkMode)}
          >
            <View className="flex-row items-center">
              <Ionicons
                name={darkMode ? "sunny" : "moon"}
                size={16}
                color="#fff"
              />
              <Text className="text-white" style={{ marginLeft: 6 }}>
                {darkMode ? "Claro" : "Oscuro"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <Text className="text-white text-xl font-bold text-center">
          Control de Gastos
        </Text>
        <Text className="text-white text-center mt-1">
          Tasa del día: {tasaDolar ? `Bs. ${tasaDolar} / $1` : "No establecida"}
        </Text>
        {activeView === "home" && (
          <>
            <View className="flex-row justify-center mt-2">
              <TouchableOpacity
                className={`mx-1 px-3 py-1 rounded border ${
                  viewMode === "week"
                    ? chipSelectedBgBorder
                    : chipUnselectedBgBorder
                }`}
                onPress={() => setViewMode("week")}
              >
                <Text
                  className={
                    viewMode === "week" ? chipSelectedText : chipUnselectedText
                  }
                >
                  Semana
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`mx-1 px-3 py-1 rounded border ${
                  viewMode === "month"
                    ? chipSelectedBgBorder
                    : chipUnselectedBgBorder
                }`}
                onPress={() => setViewMode("month")}
              >
                <Text
                  className={
                    viewMode === "month" ? chipSelectedText : chipUnselectedText
                  }
                >
                  Mes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`mx-1 px-3 py-1 rounded border ${
                  viewMode === "year"
                    ? chipSelectedBgBorder
                    : chipUnselectedBgBorder
                }`}
                onPress={() => setViewMode("year")}
              >
                <Text
                  className={
                    viewMode === "year" ? chipSelectedText : chipUnselectedText
                  }
                >
                  Año
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center justify-between mt-2">
              <TouchableOpacity
                className="px-3 py-1 rounded bg-white/20"
                onPress={() => changePeriod(-1)}
              >
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (viewMode !== "month") return;
                  const [y, m] = currentMonth.split("-").map(Number);
                  setTempYear(y);
                  setTempMonthIndex(m - 1);
                  setShowMonthModal(true);
                }}
              >
                <Text className="text-white font-semibold">
                  {periodLabel()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-3 py-1 rounded bg-white/20"
                onPress={() => changePeriod(1)}
              >
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {activeView === "home" ? (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item, index) =>
            item && item.id != null
              ? String(item.id)
              : `${item?.fecha || "row"}-${index}`
          }
          contentContainerStyle={{ paddingBottom: 32 }}
          ListHeaderComponent={
            <View>
              <View className="p-4">
                <Text className={`text-lg font-bold mb-2 ${textPrimary}`}>
                  Gastos por categoría
                </Text>
                <View className={`rounded-lg p-4 shadow-lg ${cardBgClass}`}>
                  {totalGastosVES <= 0 ? (
                    <Text className={textMuted}>
                      Sin gastos en este periodo
                    </Text>
                  ) : (
                    <>
                      <View className="items-center mb-3">
                        <View style={{ width: 220, height: 220 }}>
                          <Svg width={220} height={220} style={{ position: 'absolute', left: 0, top: 0 }}>
                            <G>
                              <Circle cx={cx} cy={cy} r={radius} stroke={donutTrackColor} strokeWidth={donutThickness} fill="none" />
                              {pieSegments.map((seg) => (
                                <Path key={seg.key} d={seg.d} fill={seg.color} />
                              ))}
                              <Circle cx={cx} cy={cy} r={centerR} fill={donutCenterFill} />
                            </G>
                          </Svg>
                          <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: darkMode ? '#ffffff' : '#111827', fontSize: 18, fontWeight: '700' }}>
                              $ {Number(totalGastosUSD || 0).toFixed(2)}
                            </Text>
                            <Text style={{ color: darkMode ? '#ffffff' : '#111827', fontSize: 12, marginTop: 2 }}>
                              Bs. {Number(totalGastosVES || 0).toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View>
                        {pieSegments.slice(0, 8).map((seg) => (
                          <View
                            key={`legend-${seg.key}`}
                            className="flex-row items-center mb-1"
                          >
                            <View
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: seg.color,
                              }}
                            />
                            <Text className={`ml-2 ${textPrimary}`}>
                              {seg.label}
                            </Text>
                            <Text className={`ml-auto ${textMuted}`}>
                              $ {Number(seg.usd || 0).toFixed(2)} • {seg.pct.toFixed(0)}%
                            </Text>
                          </View>
                        ))}
                        {pieSegments.length > 8 && (
                          <Text className={`${textMuted} mt-1`}>
                            + {pieSegments.length - 8} más
                          </Text>
                        )}
                      </View>
                    </>
                  )}
                </View>
              </View>

              <View className="p-4">
                <Text className={`text-lg font-bold mb-2 ${textPrimary}`}>
                  {viewMode === "month"
                    ? "Resumen del Mes"
                    : viewMode === "year"
                    ? "Resumen del Año"
                    : "Resumen de la Semana"}
                </Text>
                <View className={`rounded-lg p-4 shadow-lg ${cardBgClass}`}>
                  <View className="flex-row justify-between mb-2">
                    <Text className={textPrimary}>Ingresos:</Text>
                    <View className="items-end">
                      <Text className="text-green-600">
                        Bs. {totales.ingresosVES}
                      </Text>
                      <Text className="text-green-600 text-xs">
                        $ {totales.ingresosUSD}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text
                      className={exceededLimit ? "text-red-600" : textPrimary}
                    >
                      Gastos:
                    </Text>
                    <View className="items-end">
                      <Text className="text-red-600">
                        Bs. {totales.gastosVES}
                      </Text>
                      <Text className="text-red-600 text-xs">
                        $ {totales.gastosUSD}
                      </Text>
                    </View>
                  </View>
                  <View className={`border-t ${borderMutedClass} my-2`} />
                  <View className="flex-row justify-between">
                    <Text className={`font-bold ${textPrimary}`}>Balance:</Text>
                    <View className="items-end">
                      <Text
                        className={
                          parseFloat(totales.balanceVES) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        Bs. {totales.balanceVES}
                      </Text>
                      <Text
                        className={`${
                          parseFloat(totales.balanceUSD) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        } text-xs`}
                      >
                        $ {totales.balanceUSD}
                      </Text>
                    </View>
                  </View>
                </View>
                {exceededLimit &&
                  (viewMode === "week" || viewMode === "month") && (
                    <View
                      className={`mt-2 rounded-lg border p-3 ${warnBgClass}`}
                    >
                      <Text className={`${warnTextClass} font-semibold`}>
                        Excediste el limite ({limitName})
                      </Text>
                      <Text className={`${warnTextClass} mt-1 text-sm`}>
                        Categorías: {exceededCategories.join(", ")}
                      </Text>
                    </View>
                  )}
              </View>

              <View className="px-4 mb-2 flex-row justify-between items-center">
                <Text className={`text-lg font-bold ${textPrimary}`}>
                  Transacciones
                </Text>
                <View className="flex-row items-center">
                  <TouchableOpacity
                    className={`${smallBtnBgClass} px-3 py-2 rounded mr-2`}
                    onPress={() =>
                      setTxFilter((prev) =>
                        prev === "todo"
                          ? "gastos"
                          : prev === "gastos"
                          ? "ingresos"
                          : "todo"
                      )
                    }
                  >
                    <View className="flex-row items-center">
                      <Ionicons
                        name={
                          txFilter === "gastos"
                            ? "trending-down"
                            : txFilter === "ingresos"
                            ? "trending-up"
                            : "swap-horizontal"
                        }
                        size={16}
                        color={darkMode ? "#fff" : "#111827"}
                      />
                      <Text className={textPrimary} style={{ marginLeft: 6 }}>
                        {txFilter === "gastos"
                          ? "Gastos"
                          : txFilter === "ingresos"
                          ? "Ingresos"
                          : "Todo"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`${accentBtnClass} px-4 py-2 rounded`}
                    onPress={() => setShowAddModal(true)}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="add" size={18} color="#fff" />
                      <Text className="text-white" style={{ marginLeft: 6 }}>
                        Nueva
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View className="px-4 py-10 items-center">
              <Text className={textMuted}>
                No hay transacciones registradas
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className={`px-4`}>
              <View
                className={`p-3 mb-2 rounded-lg shadow ${cardBgClass}`}
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: getCategoryColor(item.categoria, item.tipo),
                }}
              >
                <View className="flex-row justify-between">
                  <View>
                    <View className="flex-row items-center">
                      <Ionicons
                        name={getCategoryIcon(item.categoria, item.tipo)}
                        size={16}
                        color={getCategoryColor(item.categoria, item.tipo)}
                      />
                      <Text
                        className={`font-medium ${textPrimary}`}
                        style={{ marginLeft: 6 }}
                      >
                        {item.descripcion}
                      </Text>
                    </View>
                    <Text className={`${textMuted} text-sm`}>
                      {formatearFecha(item.fecha)}
                    </Text>
                    <Text className={`${textMuted} text-xs`}>
                      {item.categoria ??
                        (item.tipo === "Ingreso" ? "INGRESO" : "SIN CATEGORIA")}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className={
                        item.tipo === "Ingreso"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {item.tipo === "Ingreso" ? "+" : "-"}{" "}
                      {item.moneda_original === "USD" ? "$" : "Bs."}{" "}
                      {parseFloat(item.monto_original).toFixed(2)}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      {item.moneda_original === "USD"
                        ? `Bs. ${parseFloat(item.monto_ves_registro).toFixed(
                            2
                          )}`
                        : `$ ${parseFloat(item.monto_usd_registro).toFixed(2)}`}
                    </Text>
                    {item.tasa_ves_a_usd != null && (
                      <Text className="text-gray-500 text-xs">
                        Tasa: Bs. {parseFloat(item.tasa_ves_a_usd).toFixed(2)} /
                        $1
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="p-4">
            <Text className={`text-lg font-bold mb-2 ${textPrimary}`}>
              Límites por categoría
            </Text>
            {CATEGORIES.map((cat) => {
              const v = limitsByCategory[cat] || {
                diario: "",
                semanal: "",
                mensual: "",
              };
              return (
                <View
                  key={cat}
                  className={`p-3 mb-2 rounded-lg shadow ${cardBgClass}`}
                >
                  <Text className={`font-medium mb-2 ${textPrimary}`}>
                    {cat}
                  </Text>
                  <View className="flex-row -mx-1">
                    <View className="w-1/3 px-1">
                      <Text className={`${textMuted} mb-1`}>Diario ($)</Text>
                      <TextInput
                        className={`border rounded p-2 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor={placeholderColor}
                        value={v.diario}
                        onChangeText={(t) =>
                          setLimitsByCategory((prev) => ({
                            ...prev,
                            [cat]: {
                              ...(prev[cat] || {
                                diario: "",
                                semanal: "",
                                mensual: "",
                              }),
                              diario: t,
                            },
                          }))
                        }
                      />
                    </View>
                    <View className="w-1/3 px-1">
                      <Text className={`${textMuted} mb-1`}>Semanal ($)</Text>
                      <TextInput
                        className={`border rounded p-2 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor={placeholderColor}
                        value={v.semanal}
                        onChangeText={(t) =>
                          setLimitsByCategory((prev) => ({
                            ...prev,
                            [cat]: {
                              ...(prev[cat] || {
                                diario: "",
                                semanal: "",
                                mensual: "",
                              }),
                              semanal: t,
                            },
                          }))
                        }
                      />
                    </View>
                    <View className="w-1/3 px-1">
                      <Text className={`${textMuted} mb-1`}>Mensual ($)</Text>
                      <TextInput
                        className={`border rounded p-2 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor={placeholderColor}
                        value={v.mensual}
                        onChangeText={(t) =>
                          setLimitsByCategory((prev) => ({
                            ...prev,
                            [cat]: {
                              ...(prev[cat] || {
                                diario: "",
                                semanal: "",
                                mensual: "",
                              }),
                              mensual: t,
                            },
                          }))
                        }
                      />
                    </View>
                  </View>
                </View>
              );
            })}
            <View className="flex-row justify-end mt-2">
              <TouchableOpacity
                className={`${accentBtnClass} px-4 py-2 rounded`}
                onPress={saveLimits}
              >
                <Text className="text-white">Guardar Límites</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      <Modal visible={showTasaModal} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className={`${modalBgClass} p-6 rounded-lg w-4/5`}>
            <Text className={`text-lg font-bold mb-4 ${textPrimary}`}>
              Tasa de Cambio del Día
            </Text>
            <Text className={`mb-2 ${textPrimary}`}>
              Ingrese la tasa Bs. por $1 USD:
            </Text>
            <TextInput
              className={`border rounded p-2 mb-4 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
              placeholder="Ej: 36.50"
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              value={tasaDolar}
              onChangeText={setTasaDolar}
            />
            <TouchableOpacity
              className={`${accentBtnClass} p-3 rounded items-center`}
              onPress={guardarTasaDia}
            >
              <Text className="text-white font-medium">Guardar Tasa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={showDrawer} animationType="fade" transparent>
        <View className="flex-1 flex-row">
          <View className={`${modalBgClass} w-64 h-full p-6`}>
            <Text className={`text-lg font-bold mb-4 ${textPrimary}`}>
              Menú
            </Text>
            <TouchableOpacity
              className={`mb-2 p-3 rounded ${
                activeView === "home" ? accentBtnClass : smallBtnBgClass
              }`}
              onPress={() => {
                setActiveView("home");
                setShowDrawer(false);
              }}
            >
              <Text
                className={activeView === "home" ? "text-white" : textPrimary}
              >
                Home
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`mb-2 p-3 rounded ${
                activeView === "limits" ? accentBtnClass : smallBtnBgClass
              }`}
              onPress={() => {
                setActiveView("limits");
                setShowDrawer(false);
              }}
            >
              <Text
                className={activeView === "limits" ? "text-white" : textPrimary}
              >
                Límites
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="flex-1 bg-black/50"
            onPress={() => setShowDrawer(false)}
          />
        </View>
      </Modal>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className={`${modalBgClass} p-6 rounded-lg w-4/5`}>
            <Text className={`text-lg font-bold mb-4 ${textPrimary}`}>
              Nueva Transacción
            </Text>

            <View className="flex-row justify-around mb-4">
              <TouchableOpacity
                className={`px-4 py-2 rounded ${
                  newTransaction.tipo === "Gasto" ? "bg-red-500" : "bg-gray-200"
                }`}
                onPress={() =>
                  setNewTransaction({
                    ...newTransaction,
                    tipo: "Gasto",
                    categoria: newTransaction.categoria ?? "COMIDA",
                  })
                }
              >
                <Text
                  className={
                    newTransaction.tipo === "Gasto"
                      ? "text-white"
                      : "text-gray-700"
                  }
                >
                  Gasto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-2 rounded ${
                  newTransaction.tipo === "Ingreso"
                    ? "bg-green-500"
                    : "bg-gray-200"
                }`}
                onPress={() =>
                  setNewTransaction({
                    ...newTransaction,
                    tipo: "Ingreso",
                    categoria: null,
                  })
                }
              >
                <Text
                  className={
                    newTransaction.tipo === "Ingreso"
                      ? "text-white"
                      : "text-gray-700"
                  }
                >
                  Ingreso
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              className={`border rounded p-2 mb-3 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
              placeholder="Descripción"
              placeholderTextColor={placeholderColor}
              value={newTransaction.descripcion}
              onChangeText={(text) =>
                setNewTransaction({ ...newTransaction, descripcion: text })
              }
            />

            <View className="flex-row mb-3">
              <TextInput
                className={`border rounded-l p-2 flex-1 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                placeholder="Monto"
                placeholderTextColor={placeholderColor}
                keyboardType="numeric"
                value={newTransaction.monto}
                onChangeText={(text) =>
                  setNewTransaction({ ...newTransaction, monto: text })
                }
              />
              <View
                className={`border-t border-b border-r rounded-r overflow-hidden ${inputBorderClass}`}
              >
                <TouchableOpacity
                  className={`px-3 py-2 ${smallBtnBgClass}`}
                  onPress={() =>
                    setNewTransaction({
                      ...newTransaction,
                      moneda: newTransaction.moneda === "USD" ? "VES" : "USD",
                    })
                  }
                >
                  <Text className={textPrimary}>{newTransaction.moneda}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {newTransaction.tipo === "Gasto" && (
              <>
                <Text className={`font-medium mb-2 ${textPrimary}`}>
                  Categoría
                </Text>
                <View className="flex-row flex-wrap -m-1 mb-3">
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      className={`m-1 px-3 py-2 rounded border ${
                        newTransaction.categoria === cat
                          ? chipSelectedBgBorder
                          : chipUnselectedBgBorder
                      }`}
                      onPress={() =>
                        setNewTransaction({ ...newTransaction, categoria: cat })
                      }
                    >
                      <Text
                        className={
                          newTransaction.categoria === cat
                            ? chipSelectedText
                            : chipUnselectedText
                        }
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <View className="flex-row justify-between mt-4">
              <TouchableOpacity
                className={`${minorBtnBgClass} px-4 py-2 rounded`}
                onPress={() => setShowAddModal(false)}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`${accentBtnClass} px-4 py-2 rounded`}
                onPress={agregarTransaccion}
              >
                <Text className="text-white">Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Selector de Mes */}
      <Modal visible={showMonthModal} animationType="slide" transparent>
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className={`${modalBgClass} p-6 rounded-lg w-11/12`}>
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity
                className="px-3 py-1 rounded bg-gray-100"
                onPress={() => setTempYear(tempYear - 1)}
              >
                <Text>{`<`}</Text>
              </TouchableOpacity>
              <Text className="text-lg font-bold">{tempYear}</Text>
              <TouchableOpacity
                className="px-3 py-1 rounded bg-gray-100"
                onPress={() => setTempYear(tempYear + 1)}
              >
                <Text>{`>`}</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap -mx-1">
              {MONTHS.map((m, idx) => (
                <TouchableOpacity
                  key={m}
                  className="w-1/3 p-1"
                  onPress={() => setTempMonthIndex(idx)}
                >
                  <View
                    className={`rounded border p-3 items-center ${
                      tempMonthIndex === idx
                        ? "bg-blue-100 border-blue-500"
                        : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    <Text
                      className={
                        tempMonthIndex === idx
                          ? "text-blue-700"
                          : "text-gray-700"
                      }
                    >
                      {m}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity
                className="bg-gray-300 px-4 py-2 rounded"
                onPress={() => setShowMonthModal(false)}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`${accentBtnClass} px-4 py-2 rounded`}
                onPress={() => {
                  const ym = `${tempYear}-${pad2(tempMonthIndex + 1)}`;
                  setCurrentMonth(ym);
                  setShowMonthModal(false);
                }}
              >
                <Text className="text-white">Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
