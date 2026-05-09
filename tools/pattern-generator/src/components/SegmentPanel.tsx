import type { DrawingState, DrawingVertex, SegmentType } from '../types';

interface Props {
  drawingState: DrawingState;
  onToggleSegment: (segIdx: number) => void;
  onChangeSagitta: (segIdx: number, sagitta: number) => void;
  onConfirmPiece: () => void;
  onCancelDrawing: () => void;
  onUndoVertex: () => void;
  onChangeSnap: (divisions: number) => void;
}

const SNAP_OPTIONS = [
  { label: 'なし', value: 0 },
  { label: '1/4', value: 4 },
  { label: '1/6', value: 6 },
  { label: '1/8', value: 8 },
  { label: '1/10', value: 10 },
  { label: '1/12', value: 12 },
];

const MAX_SAGITTA = 0.5;
const SAGITTA_STEP = 0.01;

export function SegmentPanel({
  drawingState,
  onToggleSegment,
  onChangeSagitta,
  onConfirmPiece,
  onCancelDrawing,
  onUndoVertex,
  onChangeSnap,
}: Props) {
  const { vertices, segments, closed, snapDivisions } = drawingState;
  const n = vertices.length;

  return (
    <div style={styles.wrapper}>
      {/* Snap grid */}
      <div style={styles.row}>
        <span style={styles.label}>スナップ</span>
        <div style={styles.snapButtons}>
          {SNAP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              style={{
                ...styles.snapBtn,
                ...(snapDivisions === opt.value ? styles.snapBtnActive : {}),
              }}
              onClick={() => onChangeSnap(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={styles.actionRow}>
        <button
          onClick={onUndoVertex}
          disabled={n === 0}
          style={{ ...styles.btn, ...(n === 0 ? styles.btnDisabled : {}) }}
        >
          ← Undo
        </button>
        <button onClick={onCancelDrawing} style={{ ...styles.btn, ...styles.btnCancel }}>
          キャンセル
        </button>
        {closed && (
          <button onClick={onConfirmPiece} style={{ ...styles.btn, ...styles.btnConfirm }}>
            ✔ ピースを追加
          </button>
        )}
      </div>

      {/* Segment controls (only when closed) */}
      {closed && segments.length > 0 && (
        <div style={styles.segList}>
          <div style={styles.segHeader}>セグメント ({segments.length} 辺)</div>
          {segments.map((seg, i) => {
            const from = vertices[i];
            const to = vertices[(i + 1) % n];
            return (
              <SegmentRow
                key={i}
                index={i}
                from={from}
                to={to}
                seg={seg}
                onToggle={() => onToggleSegment(i)}
                onChangeSagitta={(s) => onChangeSagitta(i, s)}
              />
            );
          })}
        </div>
      )}

      {/* Instructions */}
      {!closed && (
        <div style={styles.instructions}>
          <p style={styles.instLine}>① キャンバスをクリックして頂点を追加</p>
          <p style={styles.instLine}>② 3頂点以上で最初の頂点（青丸）をクリックして閉じる</p>
          <p style={styles.instLine}>③ 各セグメントの ○ をクリックして L→Q→C→A の順に切替</p>
          <p style={styles.instLine}>④「ピースを追加」で確定</p>
          <p style={styles.instTip}>
            💡 よく使うパターン:<br />
            • Drunkard's Path: 3頂点の三角形 + 斜辺を円弧に<br />
            • Orange Peel: 4頂点の正方形 + 対向2辺を円弧に<br />
            • Fan blade: 扇形（1辺を円弧に）
          </p>
        </div>
      )}
    </div>
  );
}

const SEG_LABELS: Record<string, string> = { L: '直 L', Q: '2次 Q', C: '3次 C', A: '弧 A' };

const SEG_TOGGLE_STYLE: Record<string, React.CSSProperties> = {
  Q: { background: '#22aa44', color: '#fff', borderColor: '#187730' },
  C: { background: '#7744cc', color: '#fff', borderColor: '#5530aa' },
  A: { background: '#ff8c00', color: '#fff', borderColor: '#cc6600' },
};

function SegmentRow({
  index,
  from,
  to,
  seg,
  onToggle,
  onChangeSagitta,
}: {
  index: number;
  from: DrawingVertex;
  to: DrawingVertex;
  seg: SegmentType;
  onToggle: () => void;
  onChangeSagitta: (s: number) => void;
}) {
  const sagitta = seg.kind === 'A' ? seg.sagitta : 0;

  return (
    <div style={segStyles.wrapper}>
      <span style={segStyles.idx}>{index + 1}</span>
      <span style={segStyles.coords}>
        ({fmt(from.x)},{fmt(from.y)})→({fmt(to.x)},{fmt(to.y)})
      </span>
      <button
        onClick={onToggle}
        style={{ ...segStyles.toggle, ...(SEG_TOGGLE_STYLE[seg.kind] ?? {}) }}
      >
        {SEG_LABELS[seg.kind] ?? seg.kind}
      </button>
      {seg.kind === 'A' && (
        <div style={segStyles.sliderRow}>
          <span style={segStyles.sliderLabel}>膨らみ</span>
          <input
            type="range"
            min={-MAX_SAGITTA}
            max={MAX_SAGITTA}
            step={SAGITTA_STEP}
            value={sagitta}
            onChange={(e) => onChangeSagitta(parseFloat(e.target.value))}
            style={segStyles.slider}
          />
          <span style={segStyles.sliderValue}>{sagitta.toFixed(2)}</span>
        </div>
      )}
      {(seg.kind === 'Q' || seg.kind === 'C') && (
        <span style={segStyles.cpHint}>制御点はキャンバスでドラッグ</span>
      )}
    </div>
  );
}

function fmt(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontSize: 12,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontWeight: 600,
    color: '#444',
    minWidth: 50,
    fontSize: 11,
  },
  snapButtons: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
  },
  snapBtn: {
    padding: '3px 8px',
    border: '1px solid #ccc',
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 11,
  },
  snapBtnActive: {
    background: '#4a90d9',
    color: '#fff',
    borderColor: '#3a7bc8',
  },
  actionRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  btn: {
    padding: '6px 12px',
    border: '1px solid #ccc',
    borderRadius: 6,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  btnCancel: {
    color: '#c00',
    borderColor: '#e8a0a0',
  },
  btnConfirm: {
    background: '#2d7d46',
    color: '#fff',
    borderColor: '#2d7d46',
  },
  segList: {
    border: '1px solid #ddd',
    borderRadius: 6,
    overflow: 'hidden',
  },
  segHeader: {
    background: '#f0f0f0',
    padding: '4px 8px',
    fontWeight: 700,
    fontSize: 11,
    color: '#555',
  },
  instructions: {
    background: '#f8f8f8',
    borderRadius: 6,
    padding: '8px 10px',
    lineHeight: 1.7,
  },
  instLine: { margin: 0, fontSize: 11, color: '#444' },
  instTip: { margin: '6px 0 0', fontSize: 10, color: '#888', lineHeight: 1.6 },
};

const segStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    padding: '5px 8px',
    borderBottom: '1px solid #eee',
    gap: 4,
  },
  idx: {
    fontWeight: 700,
    color: '#555',
    minWidth: 16,
    fontSize: 11,
  },
  coords: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#777',
    flexShrink: 0,
  },
  toggle: {
    padding: '2px 10px',
    border: '1px solid #ccc',
    borderRadius: 4,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
    alignSelf: 'flex-start',
  },
  toggleArc: {
    background: '#ff8c00',
    color: '#fff',
    borderColor: '#cc6600',
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  sliderLabel: {
    fontSize: 10,
    color: '#666',
  },
  slider: {
    flex: 1,
    accentColor: '#ff8c00',
  },
  sliderValue: {
    fontFamily: 'monospace',
    fontSize: 10,
    minWidth: 36,
    color: '#444',
  },
  cpHint: {
    fontSize: 10,
    color: '#888',
    fontStyle: 'italic',
  },
};
