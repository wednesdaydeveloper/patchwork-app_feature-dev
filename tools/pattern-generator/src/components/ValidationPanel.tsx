import type { ValidationResult } from '@/utils/designValidator';

interface Props {
  result: ValidationResult | null;
  onValidate: () => void;
}

export function ValidationPanel({ result, onValidate }: Props) {
  return (
    <div style={styles.wrapper}>
      <button onClick={onValidate} style={styles.btn}>
        🔍 検証する
      </button>

      {result && (
        <div style={{ ...styles.result, ...(result.ok ? styles.ok : styles.ng) }}>
          {result.ok ? (
            <span>✅ 検証通過</span>
          ) : (
            <ul style={styles.errorList}>
              {result.errors.map((err, i) => (
                <li key={i} style={styles.errorItem}>
                  {formatError(err)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function formatError(err: ValidationResult['errors'][number]): string {
  switch (err.type) {
    case 'designOutOfBounds':
      return `範囲外: ピース "${err.polygonId}" が [0,1] の外に出ています`;
    case 'designOverlap':
      return `重なり: ピース "${err.aId}" と "${err.bId}" が重なっています`;
    case 'designAreaMismatch':
      return `面積不一致: 合計 ${err.actual.toFixed(4)} (期待値 ${err.expected.toFixed(4)}) — ピースに隙間がある可能性`;
    case 'designSelfIntersect':
      return `自己交差: ピース "${err.polygonId}" のパスが自己交差しています`;
    default:
      return JSON.stringify(err);
  }
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  btn: {
    padding: '8px 14px',
    background: '#4a90d9',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    alignSelf: 'flex-start',
  },
  result: {
    padding: '10px 12px',
    borderRadius: 6,
    fontSize: 12,
    lineHeight: 1.6,
  },
  ok: {
    background: '#e6f4ea',
    color: '#2d6a3f',
    border: '1px solid #a8d5b5',
  },
  ng: {
    background: '#fdecea',
    color: '#b00020',
    border: '1px solid #f5b5b0',
  },
  errorList: {
    margin: 0,
    paddingLeft: 18,
  },
  errorItem: {
    marginBottom: 2,
  },
};
