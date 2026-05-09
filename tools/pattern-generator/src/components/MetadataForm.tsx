import type { DesignMetadata } from '../types';

interface Props {
  metadata: DesignMetadata;
  onChange: (updated: DesignMetadata) => void;
}

const CATEGORY_OPTIONS = [
  { value: 'twoGrid', label: 'twoGrid（2 グリッド）' },
  { value: 'threeGrid', label: 'threeGrid（3 グリッド）' },
  { value: 'fourGrid', label: 'fourGrid（4 グリッド）' },
  { value: 'fiveGrid', label: 'fiveGrid（5 グリッド）' },
  { value: 'freeform', label: 'freeform（自由形状）' },
];

export function MetadataForm({ metadata, onChange }: Props) {
  const set = <K extends keyof DesignMetadata>(key: K, value: DesignMetadata[K]) =>
    onChange({ ...metadata, [key]: value });

  return (
    <div style={styles.wrapper}>
      <Row label="ID *">
        <input
          style={styles.input}
          value={metadata.id}
          onChange={(e) => set('id', e.target.value)}
          placeholder="例: nine-patch"
          spellCheck={false}
        />
      </Row>
      <Row label="Name (英語) *">
        <input
          style={styles.input}
          value={metadata.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="例: Nine Patch"
        />
      </Row>
      <Row label="NameJa (日本語) *">
        <input
          style={styles.input}
          value={metadata.nameJa}
          onChange={(e) => set('nameJa', e.target.value)}
          placeholder="例: ナインパッチ"
        />
      </Row>
      <Row label="Category *">
        <select
          style={styles.select}
          value={metadata.category}
          onChange={(e) => set('category', e.target.value)}
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </Row>
      <Row label="Grid Size">
        <input
          style={{ ...styles.input, width: 80 }}
          type="number"
          min={1}
          max={20}
          value={metadata.gridSize ?? ''}
          placeholder="null"
          onChange={(e) => {
            const v = e.target.value;
            set('gridSize', v === '' ? null : parseInt(v, 10));
          }}
        />
        <span style={styles.hint}>自由形状は空欄</span>
      </Row>
      <Row label="Thumbnail">
        <input
          style={styles.input}
          value={metadata.thumbnailFilename}
          onChange={(e) => set('thumbnailFilename', e.target.value)}
          placeholder="例: nine-patch.png"
          spellCheck={false}
        />
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={rowStyles.row}>
      <label style={rowStyles.label}>{label}</label>
      <div style={rowStyles.control}>{children}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  input: {
    width: '100%',
    padding: '5px 8px',
    border: '1px solid #ccc',
    borderRadius: 4,
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '5px 8px',
    border: '1px solid #ccc',
    borderRadius: 4,
    fontSize: 13,
    fontFamily: 'inherit',
    background: '#fff',
    outline: 'none',
  },
  hint: {
    fontSize: 11,
    color: '#888',
    marginLeft: 6,
  },
};

const rowStyles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: '#444',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  control: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
};
