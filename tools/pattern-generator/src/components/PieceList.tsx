import type { EditablePiece } from '../types';

interface Props {
  pieces: EditablePiece[];
  selectedPieceId: string | null;
  onSelectPiece: (id: string) => void;
  onUpdatePiece: (id: string, field: 'id' | 'label', value: string) => void;
  onDeletePiece: (internalId: string) => void;
}

export function PieceList({ pieces, selectedPieceId, onSelectPiece, onUpdatePiece, onDeletePiece }: Props) {
  if (pieces.length === 0) {
    return <p style={styles.empty}>グリッドを生成するとピース一覧が表示されます。</p>;
  }

  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Label（翻訳キー）</th>
            <th style={styles.th} />
          </tr>
        </thead>
        <tbody>
          {pieces.map((piece, idx) => {
            const isSelected = piece.internalId === selectedPieceId;
            return (
              <tr
                key={piece.internalId}
                style={{ ...styles.row, ...(isSelected ? styles.rowSelected : {}) }}
                onClick={() => onSelectPiece(piece.internalId)}
              >
                <td style={styles.td}>{idx + 1}</td>
                <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                  <input
                    style={styles.input}
                    value={piece.id}
                    onChange={(e) => onUpdatePiece(piece.internalId, 'id', e.target.value)}
                    spellCheck={false}
                  />
                </td>
                <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                  <input
                    style={styles.input}
                    value={piece.label}
                    onChange={(e) => onUpdatePiece(piece.internalId, 'label', e.target.value)}
                    spellCheck={false}
                    placeholder="例: topLeft, center"
                  />
                </td>
                <td style={styles.tdDelete} onClick={(e) => e.stopPropagation()}>
                  <button
                    style={styles.deleteBtn}
                    title="このピースを削除"
                    onClick={() => onDeletePiece(piece.internalId)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    overflowY: 'auto',
    maxHeight: 260,
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: 12,
  },
  empty: {
    color: '#999',
    fontSize: 12,
    padding: '8px 4px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '6px 8px',
    background: '#f0f0f0',
    borderBottom: '1px solid #ddd',
    fontWeight: 600,
    fontSize: 11,
    position: 'sticky',
    top: 0,
  },
  row: {
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
    background: '#fff',
    transition: 'background 0.1s',
  },
  rowSelected: {
    background: '#eef4fb',
  },
  td: {
    padding: '4px 8px',
    verticalAlign: 'middle',
  },
  input: {
    width: '100%',
    padding: '3px 5px',
    border: '1px solid #ddd',
    borderRadius: 4,
    fontSize: 12,
    fontFamily: 'monospace',
    background: 'transparent',
    outline: 'none',
  },
};
