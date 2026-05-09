import { useCallback, useState } from 'react';
import { validateDesign } from '@/utils/designValidator';
import type { ValidationResult } from '@/utils/designValidator';
import { DrawingCanvas } from './components/DrawingCanvas';
import { ImageDropzone } from './components/ImageDropzone';
import { MetadataForm } from './components/MetadataForm';
import { PatternCanvas } from './components/PatternCanvas';
import { PieceList } from './components/PieceList';
import { SegmentPanel } from './components/SegmentPanel';
import { ValidationPanel } from './components/ValidationPanel';
import { buildSvgPath } from './lib/pathBuilder';
import {
  generateGridPieces,
  suggestCategory,
  suggestGridSize,
} from './lib/gridGenerator';
import { generateThumbnail } from './lib/thumbnailGenerator';
import { INITIAL_DRAWING_STATE as DRAWING_INIT } from './types';
import type {
  AppState,
  DesignFileOutput,
  DrawingState,
  DrawingVertex,
  SegmentType,
} from './types';

const DEFAULT_STATE: AppState = {
  referenceImageUrl: null,
  cols: 3,
  rows: 3,
  pieces: [],
  metadata: {
    id: '',
    name: '',
    nameJa: '',
    category: 'threeGrid',
    gridSize: 3,
    thumbnailFilename: '',
  },
  selectedPieceId: null,
};

export function App() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [localCols, setLocalCols] = useState(DEFAULT_STATE.cols);
  const [localRows, setLocalRows] = useState(DEFAULT_STATE.rows);
  const [drawing, setDrawing] = useState<DrawingState>(DRAWING_INIT);

  const setStateField = <K extends keyof AppState>(key: K, value: AppState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  // ---------- Grid handlers ----------

  const handleGenerate = useCallback(() => {
    const pieces = generateGridPieces(localCols, localRows);
    const category = suggestCategory(localCols, localRows);
    const gridSize = suggestGridSize(localCols, localRows);
    setState((prev) => ({
      ...prev,
      cols: localCols,
      rows: localRows,
      pieces,
      selectedPieceId: null,
      metadata: {
        ...prev.metadata,
        category,
        gridSize,
        thumbnailFilename: prev.metadata.thumbnailFilename || `${prev.metadata.id || 'pattern'}.png`,
      },
    }));
    setValidationResult(null);
  }, [localCols, localRows]);

  const handleUpdatePiece = useCallback(
    (internalId: string, field: 'id' | 'label', value: string) => {
      setState((prev) => ({
        ...prev,
        pieces: prev.pieces.map((p) => {
          if (p.internalId !== internalId) return p;
          return { ...p, [field]: value };
        }),
      }));
    },
    [],
  );

  const handleDeletePiece = useCallback((internalId: string) => {
    setState((prev) => ({
      ...prev,
      pieces: prev.pieces.filter((p) => p.internalId !== internalId),
      selectedPieceId: prev.selectedPieceId === internalId ? null : prev.selectedPieceId,
    }));
    setValidationResult(null);
  }, []);

  // ---------- Drawing handlers ----------

  const handleStartDrawing = useCallback(() => {
    setDrawing((prev) => ({ ...prev, active: true, vertices: [], segments: [], closed: false }));
  }, []);

  const handleAddVertex = useCallback((v: DrawingVertex) => {
    setDrawing((prev) => {
      if (prev.closed) return prev;
      const newVertices = [...prev.vertices, v];
      // Add a straight segment for the new edge
      const newSegments: SegmentType[] =
        newVertices.length > 1 ? [...prev.segments, { kind: 'L' }] : prev.segments;
      return { ...prev, vertices: newVertices, segments: newSegments };
    });
  }, []);

  const handleClosePath = useCallback(() => {
    setDrawing((prev) => {
      if (prev.vertices.length < 3 || prev.closed) return prev;
      // Add the closing segment (last → first)
      const closingSegment: SegmentType = { kind: 'L' };
      return {
        ...prev,
        segments: [...prev.segments, closingSegment],
        closed: true,
      };
    });
  }, []);

  const handleToggleSegment = useCallback((segIdx: number) => {
    setDrawing((prev) => {
      if (!prev.closed) return prev;
      const seg = prev.segments[segIdx];
      const updated: SegmentType =
        seg.kind === 'L' ? { kind: 'A', sagitta: 0.1 } : { kind: 'L' };
      const newSegments = prev.segments.map((s, i) => (i === segIdx ? updated : s));
      return { ...prev, segments: newSegments };
    });
  }, []);

  const handleChangeSagitta = useCallback((segIdx: number, sagitta: number) => {
    setDrawing((prev) => {
      const newSegments = prev.segments.map((s, i) => {
        if (i !== segIdx || s.kind !== 'A') return s;
        return { ...s, sagitta };
      });
      return { ...prev, segments: newSegments };
    });
  }, []);

  const handleUndoVertex = useCallback(() => {
    setDrawing((prev) => {
      if (prev.closed) {
        // Reopen: remove closing segment
        return { ...prev, closed: false, segments: prev.segments.slice(0, -1) };
      }
      if (prev.vertices.length === 0) return prev;
      return {
        ...prev,
        vertices: prev.vertices.slice(0, -1),
        segments: prev.segments.slice(0, -1),
      };
    });
  }, []);

  const handleCancelDrawing = useCallback(() => {
    setDrawing(DRAWING_INIT);
  }, []);

  const handleChangeSnap = useCallback((divisions: number) => {
    setDrawing((prev) => ({ ...prev, snapDivisions: divisions }));
  }, []);

  const handleConfirmPiece = useCallback(() => {
    const { vertices, segments } = drawing;
    if (vertices.length < 3 || !drawing.closed) return;

    const path = buildSvgPath(vertices, segments);
    const pieceCount = state.pieces.length + 1;

    setState((prev) => ({
      ...prev,
      pieces: [
        ...prev.pieces,
        {
          internalId: crypto.randomUUID(),
          id: `piece_${pieceCount}`,
          label: `piece_${pieceCount}`,
          path,
          cells: { colStart: 0, colEnd: 1, rowStart: 0, rowEnd: 1 },
        },
      ],
    }));
    setValidationResult(null);

    // Reset drawing state but keep active for next piece
    setDrawing((prev) => ({
      ...prev,
      vertices: [],
      segments: [],
      closed: false,
    }));
  }, [drawing, state.pieces.length]);

  // ---------- Validation & Download ----------

  const handleValidate = useCallback(() => {
    if (state.pieces.length === 0) return;
    const design = buildDesignForValidation(state);
    const result = validateDesign(design);
    setValidationResult(result);
  }, [state]);

  const handleDownloadJson = useCallback(() => {
    const { metadata, pieces } = state;
    const output: DesignFileOutput = {
      version: '1.0',
      design: {
        id: metadata.id || 'untitled',
        name: metadata.name || 'Untitled',
        nameJa: metadata.nameJa || '無題',
        category: metadata.category,
        gridSize: metadata.gridSize,
        thumbnail: metadata.thumbnailFilename || `${metadata.id || 'pattern'}.png`,
        polygons: pieces.map((p) => ({ id: p.id, label: p.label, path: p.path })),
      },
    };
    const json = JSON.stringify(output, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${output.design.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [state]);

  const handleDownloadThumbnail = useCallback(() => {
    const { metadata, pieces } = state;
    const dataUrl = generateThumbnail(pieces);
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = metadata.thumbnailFilename || `${metadata.id || 'pattern'}.png`;
    a.click();
  }, [state]);

  const canDownload =
    state.pieces.length > 0 &&
    state.metadata.id.trim() !== '' &&
    validationResult?.ok === true;

  const isDrawing = drawing.active;

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <h1 style={styles.title}>🧵 Pattern Generator</h1>
        <span style={styles.subtitle}>パッチワーク パターン JSON 生成ツール</span>
        {isDrawing && (
          <span style={styles.drawingBadge}>✏️ 手描きモード</span>
        )}
      </header>

      <div style={styles.body}>
        {/* ===== LEFT PANEL ===== */}
        <aside style={styles.leftPanel}>
          {!isDrawing ? (
            <>
              <Section title="1. 参照画像（任意）">
                <ImageDropzone
                  imageUrl={state.referenceImageUrl}
                  onImageLoaded={(url) => setStateField('referenceImageUrl', url)}
                  onImageCleared={() => setStateField('referenceImageUrl', null)}
                />
              </Section>

              <Section title="2. グリッド生成">
                <div style={styles.gridControls}>
                  <label style={styles.controlLabel}>
                    列数 (cols)
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={localCols}
                      onChange={(e) => setLocalCols(Math.max(1, parseInt(e.target.value) || 1))}
                      style={styles.numberInput}
                    />
                  </label>
                  <label style={styles.controlLabel}>
                    行数 (rows)
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={localRows}
                      onChange={(e) => setLocalRows(Math.max(1, parseInt(e.target.value) || 1))}
                      style={styles.numberInput}
                    />
                  </label>
                </div>
                <button onClick={handleGenerate} style={styles.generateBtn}>
                  ▶ グリッドを生成
                </button>
              </Section>

              <Section title="3. 手描き追加">
                <p style={styles.drawHint}>
                  直線・円弧を組み合わせた任意形状のピースを手動で描けます。
                  Drunkard's Path・Orange Peel・Fan など曲線パターンに使用。
                </p>
                <button onClick={handleStartDrawing} style={styles.drawBtn}>
                  ✏️ 手描きモードを開始
                </button>
              </Section>

              <Section title="4. ピース一覧">
                <PieceList
                  pieces={state.pieces}
                  selectedPieceId={state.selectedPieceId}
                  onSelectPiece={(id) => setStateField('selectedPieceId', id)}
                  onUpdatePiece={handleUpdatePiece}
                  onDeletePiece={handleDeletePiece}
                />
              </Section>
            </>
          ) : (
            <Section title="✏️ 手描きモード">
              <SegmentPanel
                drawingState={drawing}
                onToggleSegment={handleToggleSegment}
                onChangeSagitta={handleChangeSagitta}
                onConfirmPiece={handleConfirmPiece}
                onCancelDrawing={handleCancelDrawing}
                onUndoVertex={handleUndoVertex}
                onChangeSnap={handleChangeSnap}
              />
            </Section>
          )}
        </aside>

        {/* ===== CENTER CANVAS ===== */}
        <main style={styles.canvasArea}>
          {isDrawing ? (
            <DrawingCanvas
              existingPieces={state.pieces}
              drawingState={drawing}
              onAddVertex={handleAddVertex}
              onClosePath={handleClosePath}
              onToggleSegment={handleToggleSegment}
              size={480}
            />
          ) : (
            <>
              <PatternCanvas
                pieces={state.pieces}
                cols={state.cols}
                rows={state.rows}
                referenceImageUrl={state.referenceImageUrl}
                selectedPieceId={state.selectedPieceId}
                onSelectPiece={(id) => setStateField('selectedPieceId', id)}
                size={480}
              />
              {state.pieces.length > 0 && (
                <p style={styles.canvasHint}>
                  ピースをクリックして選択 → 左パネルの一覧で ID/ラベルを編集
                </p>
              )}
            </>
          )}
        </main>

        {/* ===== RIGHT PANEL ===== */}
        <aside style={styles.rightPanel}>
          <Section title={isDrawing ? '5. デザイン情報' : '5. デザイン情報'}>
            <MetadataForm
              metadata={state.metadata}
              onChange={(m) => setStateField('metadata', m)}
            />
          </Section>

          <Section title="6. 検証">
            <ValidationPanel result={validationResult} onValidate={handleValidate} />
          </Section>

          <Section title="7. ダウンロード">
            <div style={styles.downloadButtons}>
              <button
                onClick={handleDownloadJson}
                disabled={!canDownload}
                style={{ ...styles.downloadBtn, ...(canDownload ? {} : styles.btnDisabled) }}
              >
                ⬇ JSON をダウンロード
              </button>
              <button
                onClick={handleDownloadThumbnail}
                disabled={!canDownload}
                style={{
                  ...styles.downloadBtn,
                  ...styles.downloadBtnSecondary,
                  ...(canDownload ? {} : styles.btnDisabled),
                }}
              >
                🖼 サムネイル PNG をダウンロード
              </button>
            </div>
            {canDownload && (
              <div style={styles.registrationGuide}>
                <p style={styles.guideTitle}>📌 リポジトリへの配置手順</p>
                <ol style={styles.guideList}>
                  <li>
                    JSON → <code>constants/designs/{state.metadata.id}.json</code>
                  </li>
                  <li>
                    PNG → <code>assets/designs/{state.metadata.thumbnailFilename || `${state.metadata.id}.png`}</code>
                  </li>
                  <li>
                    <code>constants/designs/index.ts</code> の <code>RAW_DESIGN_FILES</code> に import 追加
                  </li>
                  <li>
                    <code>npx expo start</code> で表示確認
                  </li>
                </ol>
              </div>
            )}
          </Section>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={sectionStyles.wrapper}>
      <h2 style={sectionStyles.title}>{title}</h2>
      {children}
    </section>
  );
}

function buildDesignForValidation(state: AppState) {
  return {
    id: state.metadata.id || 'preview',
    name: state.metadata.name || 'Preview',
    nameJa: state.metadata.nameJa || 'プレビュー',
    category: state.metadata.category,
    gridSize: state.metadata.gridSize,
    thumbnail: state.metadata.thumbnailFilename || 'preview.png',
    polygons: state.pieces.map((p) => ({ id: p.id, label: p.label, path: p.path })),
  };
}

// ---------- Styles ----------

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#f0f2f5',
  },
  header: {
    background: '#1a1a2e',
    color: '#fff',
    padding: '14px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  title: { fontSize: 20, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: 12, color: '#aac' },
  drawingBadge: {
    background: '#ff8c00',
    color: '#fff',
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 700,
  },
  body: {
    display: 'flex',
    flex: 1,
    gap: 16,
    padding: '16px',
    alignItems: 'flex-start',
  },
  leftPanel: {
    width: 280,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  canvasArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  canvasHint: { fontSize: 11, color: '#777', textAlign: 'center' },
  rightPanel: {
    width: 300,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  gridControls: { display: 'flex', gap: 16, marginBottom: 10 },
  controlLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 12,
    color: '#444',
    fontWeight: 600,
  },
  numberInput: {
    width: 70,
    padding: '5px 8px',
    border: '1px solid #ccc',
    borderRadius: 4,
    fontSize: 14,
    textAlign: 'center',
    outline: 'none',
  },
  generateBtn: {
    width: '100%',
    padding: '9px 0',
    background: '#2d7d46',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
  },
  drawHint: { fontSize: 11, color: '#666', marginBottom: 8, lineHeight: 1.6 },
  drawBtn: {
    width: '100%',
    padding: '9px 0',
    background: '#ff8c00',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
  },
  downloadButtons: { display: 'flex', flexDirection: 'column', gap: 8 },
  downloadBtn: {
    padding: '9px 14px',
    background: '#4a90d9',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center',
  },
  downloadBtnSecondary: { background: '#7b68ee' },
  btnDisabled: { background: '#bbb', cursor: 'not-allowed', color: '#eee' },
  registrationGuide: {
    marginTop: 10,
    background: '#fff8e1',
    border: '1px solid #ffe082',
    borderRadius: 6,
    padding: '10px 12px',
    fontSize: 11,
    lineHeight: 1.7,
  },
  guideTitle: { fontWeight: 700, marginBottom: 4, fontSize: 12 },
  guideList: { paddingLeft: 18, margin: 0 },
};

const sectionStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: '#fff',
    borderRadius: 8,
    padding: '12px 14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#555',
    marginBottom: 10,
    borderBottom: '1px solid #eee',
    paddingBottom: 6,
  },
};
