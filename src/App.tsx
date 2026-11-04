import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  Check,
  Menu,
  Moon,
  Plus,
  Search,
  SlidersHorizontal,
  Sun,
  Undo2,
  X,
} from "lucide-react";
import { initialDevices } from "./data/devices";
import {
  categories,
  dateLabel,
  emptyDevice,
  historyFor,
  money,
  validateDevice,
  type Device,
} from "./lib/model";
import { fromCsv, toCsv } from "./lib/csv";
import { SNAPSHOT, summarize } from "./lib/score";
import { Score } from "./components/Score";
import { DeviceEditor } from "./components/DeviceEditor";
import { Modal, Segmented } from "./components/Shared";
import { Portfolio } from "./components/Portfolio";

const STORAGE = "wuji-score-devices-v1";
function loadDevices() {
  try {
    const saved = localStorage.getItem(STORAGE) ?? localStorage.getItem("wuji-devices-v1");
    if (!saved) return { devices: initialDevices as Device[], error: "" };
    const data = JSON.parse(saved);
    if (
      !Array.isArray(data) ||
      data.some((d) => !d || validateDevice(d)) ||
      new Set(data.map((d) => d.id)).size !== data.length
    )
      throw new Error();
    return { devices: data as Device[], error: "" };
  } catch {
    return {
      devices: initialDevices as Device[],
      error: "本地记录无法读取，暂显示初始快照；原存档未覆盖。请先导出备份。",
    };
  }
}
export default function App() {
  const [initial] = useState(loadDevices);
  const [devices, setDevices] = useState(initial.devices);
  const [message, setMessage] = useState(initial.error);
  const [undo, setUndo] = useState<Device[] | null>(null);
  const [theme, setTheme] = useState(() => {
    try {
      return (localStorage.getItem("wuji-score-theme") ?? localStorage.getItem("wuji-theme")) === "light"
        ? "light"
        : "dark";
    } catch {
      return "dark";
    }
  });
  const [menu, setMenu] = useState(false);
  const [view, setView] = useState<"score" | "stats">("score");
  const [mode, setMode] = useState<"timeline" | "ranking">("timeline");
  const [period, setPeriod] = useState<"day" | "year">("day");
  const [today, setToday] = useState(SNAPSHOT);
  const [filters, setFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部");
  const [category, setCategory] = useState("全部");
  const [sort, setSort] = useState("original");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editor, setEditor] = useState<Device | null>(null);
  const [pendingImport, setPendingImport] = useState<Device[] | null>(null);
  const [importMode, setImportMode] = useState("merge");
  const [deleteDevice, setDeleteDevice] = useState<Device | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const histories = useMemo(
    () => new Map(devices.map((d) => [d.id, historyFor(d, devices, today)])),
    [devices, today],
  );
  const summary = useMemo(
    () => summarize(devices, histories, today),
    [devices, histories, today],
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("wuji-score-theme", theme);
    } catch {
      /* Theme works in memory too. */
    }
  }, [theme]);
  useEffect(() => {
    if (!menu) return;
    const outside = (e: PointerEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !menuButton.current?.contains(e.target as Node)
      )
        setMenu(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [menu]);
  function commit(next: Device[], text: string, reversible = true) {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(next));
      setUndo(reversible ? devices : null);
      setDevices(next);
      setMessage(text);
      return true;
    } catch {
      setMessage(
        "保存失败：浏览器存储不可用或空间不足。修改尚未保存，请导出备份。",
      );
      return false;
    }
  }
  function exportCsv() {
    const url = URL.createObjectURL(
      new Blob([toCsv(devices)], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `kept-${today}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMenu(false);
    setMessage(`已导出 ${devices.length} 件设备的完整档案。`);
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("CSV 请控制在 10 MB 以内");
      setPendingImport(fromCsv(await file.text()));
      setImportMode("merge");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "导入失败");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
      setMenu(false);
    }
  }
  function save(d: Device) {
    const exists = devices.some((item) => item.id === d.id);
    if (
      !commit(
        exists
          ? devices.map((item) => (item.id === d.id ? d : item))
          : [...devices, d],
        `已${exists ? "更新" : "记录"} ${d.name}`,
      )
    )
      return false;
    setEditor(null);
    setExpanded(d.id);
    setQuery("");
    setCategory("全部");
    setStatus("全部");
    setView("score");
    setTimeout(
      () =>
        document
          .getElementById(`row-${d.id}`)
          ?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
      100,
    );
    return true;
  }
  const filterCount =
    Number(!!query) + Number(status !== "全部") + Number(category !== "全部");
  return (
    <>
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <div className="app-shell">
        <header className="topbar">
          <a
            href="#"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              setView("score");
            }}
            aria-label="kept 首页"
          >
            <span className="brand-wordmark">kept</span>
          </a>
          <nav className="desktop-nav" aria-label="主导航">
            <button
              aria-current={view === "score" ? "page" : undefined}
              onClick={() => setView("score")}
            >
              设备总谱
            </button>
            <button
              aria-current={view === "stats" ? "page" : undefined}
              onClick={() => setView("stats")}
            >
              统计
            </button>
          </nav>
          <div className="header-actions">
            <button
              className="add-button"
              onClick={() =>
                setEditor({ ...emptyDevice(), purchaseDate: today })
              }
            >
              <Plus size={15} />
              <span>新增设备</span>
            </button>
            <button
              ref={menuButton}
              className="icon-button"
              aria-label="打开菜单"
              aria-expanded={menu}
              aria-controls="main-menu"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
          {menu && (
            <div className="menu-panel glass" id="main-menu" ref={menuRef}>
              <p className="eyebrow">kept</p>
              <nav className="mobile-nav" aria-label="手机导航">
                <button
                  onClick={() => {
                    setView("score");
                    setMenu(false);
                  }}
                >
                  设备总谱 {view === "score" && <Check size={14} />}
                </button>
                <button
                  onClick={() => {
                    setView("stats");
                    setMenu(false);
                  }}
                >
                  统计 {view === "stats" && <Check size={14} />}
                </button>
              </nav>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                {theme === "dark" ? "切换明亮主题" : "切换深色主题"}
              </button>
              <button onClick={() => fileRef.current?.click()}>
                <ArrowUpFromLine size={16} />
                导入 CSV
              </button>
              <button onClick={exportCsv}>
                <ArrowDownToLine size={16} />
                导出 CSV
              </button>
              <div className="menu-date">
                <label htmlFor="cutoff">统计截止日</label>
                <input
                  id="cutoff"
                  type="date"
                  value={today}
                  min="1900-01-01"
                  max="2200-12-31"
                  onChange={(e) => {
                    if (
                      /^\d{4}-\d{2}-\d{2}$/.test(e.target.value) &&
                      e.target.value >= "1900-01-01" &&
                      e.target.value <= "2200-12-31"
                    )
                      setToday(e.target.value);
                  }}
                />
                <button
                  className="text-button"
                  onClick={() => setToday(SNAPSHOT)}
                >
                  回到 2026.11.03 快照
                </button>
              </div>
              <p className="caption">记录保存在此浏览器，CSV 可完整备份。</p>
            </div>
          )}
        </header>
        <input
          hidden
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          aria-label="导入 CSV 文件"
          onChange={(e) => void importFile(e.target.files?.[0])}
        />
        <main id="main" tabIndex={-1}>
          <section className="hero" aria-label="持有成本汇总">
            <div className="hero-intro">
              <p className="eyebrow">
                <span className="live-dot" /> PERSONAL DEVICE LEDGER
              </p>
              <h1>
                {view === "score" ? "设备总谱" : "时间里的成本"}
                <span>
                  {view === "score" ? "Device Score" : "Cost Insights"}
                </span>
              </h1>
              <p className="hero-description">
                {view === "score"
                  ? "把每一段陪伴，放在同一条时间里。"
                  : "看见投入的变化，也看见时间的价值。"}
              </p>
              <div className="inventory-count">
                <span>
                  <i />
                  在用{" "}
                  <b>{summary.active.length.toString().padStart(2, "0")}</b>
                </span>
                <span>
                  <i />
                  归档 <b>{summary.archived.toString().padStart(2, "0")}</b>
                </span>
                <span className="snapshot-label">{dateLabel(today)} 截止</span>
              </div>
            </div>
            <div className="hero-daily">
              <p className="metric-label">当前日均合计</p>
              <div className="main-number">
                <span>¥</span>
                {summary.daily.toLocaleString("zh-CN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <small>/天</small>
              </div>
              <p className="caption">
                {summary.active.length} 件在用设备 · 含已发生追加
              </p>
            </div>
            <div className="hero-investment">
              <p className="metric-label">当前持有投入</p>
              <strong>{money(summary.total)}</strong>
              <p className="caption">
                {summary.incomplete ? (
                  <>
                    <span className="pending-dot" />
                    {summary.incomplete} 件价格待补充 · 仅计已知支出
                  </>
                ) : (
                  "购入与已发生追加的累计投入"
                )}
              </p>
            </div>
          </section>
          {view === "score" ? (
            <section className="score-section" aria-label="设备总谱">
              <div className="score-toolbar">
                <Segmented
                  label="总谱视图"
                  value={mode}
                  options={[
                    { value: "timeline", label: "时间线" },
                    { value: "ranking", label: "排行" },
                  ]}
                  onChange={setMode}
                />
                <span className="toolbar-hint">
                  {mode === "timeline"
                    ? "十指之间，是时间的刻度。"
                    : "每一天的成本，在此一目了然。"}
                </span>
                <div className="score-tools">
                  {mode === "ranking" ? (
                    <Segmented
                      label="排行单位"
                      value={period}
                      options={[
                        { value: "day", label: "日均" },
                        { value: "year", label: "年均" },
                      ]}
                      onChange={setPeriod}
                    />
                  ) : (
                    <select
                      aria-label="时间线排序"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="original">原始顺序</option>
                      <option value="oldest">最早购入</option>
                      <option value="newest">最近购入</option>
                      <option value="longest">持有最长</option>
                      <option value="shortest">持有最短</option>
                      <option value="daily">日均成本 ↓</option>
                      <option value="name">设备名称</option>
                      <option value="status">设备状态</option>
                    </select>
                  )}
                  <button
                    className={
                      "filter-toggle " +
                      (filters || filterCount ? "active" : "")
                    }
                    aria-label="筛选设备"
                    aria-expanded={filters}
                    onClick={() => setFilters(!filters)}
                  >
                    <SlidersHorizontal size={15} />
                    <span>筛选{filterCount ? ` ${filterCount}` : ""}</span>
                  </button>
                </div>
              </div>
              {filters && (
                <div className="filter-bar">
                  <label className="search-field">
                    <Search size={16} />
                    <input
                      type="search"
                      aria-label="搜索设备"
                      placeholder="搜索名称、标签或明细"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="设备状态"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option>全部</option>
                    <option>持有</option>
                    <option>归档</option>
                  </select>
                  <select
                    aria-label="设备分类"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="全部">全部分类</option>
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  {filterCount > 0 && (
                    <button
                      className="text-button"
                      onClick={() => {
                        setQuery("");
                        setStatus("全部");
                        setCategory("全部");
                      }}
                    >
                      清除筛选
                    </button>
                  )}
                </div>
              )}
              <Score
                devices={devices}
                histories={histories}
                today={today}
                mode={mode}
                period={period}
                sort={sort}
                query={query}
                status={status}
                category={category}
                expanded={expanded}
                onExpand={setExpanded}
                onEdit={setEditor}
                onDelete={setDeleteDevice}
              />
              <div className="score-caption">
                <div className="legend">
                  <span>
                    <i className="key-track" />
                    持有轨道
                  </span>
                  <span>
                    <i className="key-tick" />
                    追加投入
                  </span>
                  <span>
                    <i className="key-recovery" />
                    归档回收
                  </span>
                </div>
                <p>
                  {mode === "timeline"
                    ? "点击设备展开曲线 · 点击刻度查看支出"
                    : "从高到低 · 年均 = 日均 × 365，非年度实际支出"}
                </p>
              </div>
            </section>
          ) : (
            <Portfolio devices={devices} histories={histories} today={today} />
          )}
        </main>
        <footer className="page-footer">
          <span>物有所值，时间作答。</span>
          <button
            className="text-button"
            onClick={() => setView(view === "score" ? "stats" : "score")}
          >
            {view === "score" ? "查看成本统计" : "回到设备总谱"}
            <ArrowUpRight size={14} />
          </button>
          <span className="footer-meta">
            kept <i /> 个人设备成本账本
          </span>
        </footer>
      </div>
      {message && (
        <div className="toast" role="status">
          <span>{message}</span>
          {undo && (
            <button onClick={() => commit(undo, "已撤销，记录已恢复。", false)}>
              <Undo2 size={14} />
              撤销
            </button>
          )}
          <button
            className="icon-button"
            aria-label="关闭提示"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {editor && (
        <DeviceEditor
          device={editor}
          isNew={!devices.some((d) => d.id === editor.id)}
          onClose={() => setEditor(null)}
          onSave={save}
        />
      )}
      {deleteDevice && (
        <Modal title="删除设备记录" onClose={() => setDeleteDevice(null)}>
          <p>将从账本移除「{deleteDevice.name}」及其明细。删除后可撤销。</p>
          <div className="dialog-actions">
            <button onClick={() => setDeleteDevice(null)}>保留记录</button>
            <button
              className="danger-button"
              onClick={() => {
                if (
                  commit(
                    devices.filter((d) => d.id !== deleteDevice.id),
                    `已删除 ${deleteDevice.name}，可撤销。`,
                  )
                ) {
                  setDeleteDevice(null);
                  setExpanded(null);
                }
              }}
            >
              删除记录
            </button>
          </div>
        </Modal>
      )}
      {pendingImport && (
        <Modal title="导入设备记录" onClose={() => setPendingImport(null)}>
          <p>已校验 {pendingImport.length} 件设备，选择如何写入账本。</p>
          <Segmented
            label="导入方式"
            value={importMode}
            onChange={setImportMode}
            options={[
              { value: "merge", label: "合并记录" },
              { value: "replace", label: "替换全部" },
            ]}
          />
          <p className="caption">
            {importMode === "merge"
              ? "相同 ID 更新，其余记录保留。"
              : `将以文件中的 ${pendingImport.length} 条记录替换当前 ${devices.length} 条记录。`}
            导入后可撤销。
          </p>
          <div className="dialog-actions">
            <button onClick={() => setPendingImport(null)}>取消</button>
            <button
              className="primary"
              onClick={() => {
                const next =
                  importMode === "replace"
                    ? pendingImport
                    : [
                        ...devices.filter(
                          (d) => !pendingImport.some((p) => p.id === d.id),
                        ),
                        ...pendingImport,
                      ];
                if (
                  commit(
                    next,
                    `已导入 ${pendingImport.length} 件设备，可撤销。`,
                  )
                ) {
                  setPendingImport(null);
                  setExpanded(null);
                  setQuery("");
                  setStatus("全部");
                  setCategory("全部");
                }
              }}
            >
              确认导入
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
