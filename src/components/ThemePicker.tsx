import { useTheme } from '../contexts/ThemeContext';

export function ThemePicker() {
  const { themeId, setTheme, themes } = useTheme();

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.05em] mb-3" style={{ color: 'var(--t3)' }}>
        Choose Theme
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        {themes.map((t) => {
          const isActive = t.id === themeId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className="relative rounded-xl p-3 text-left transition-all"
              style={{
                background: t.preview.surface,
                border: isActive ? `2px solid ${t.preview.accent}` : `1.5px solid ${t.preview.border}`,
                boxShadow: isActive ? `0 0 0 3px ${t.preview.accent}20` : '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {/* Color swatches row */}
              <div className="flex gap-1.5 mb-2">
                <span
                  className="w-5 h-5 rounded-full"
                  style={{ background: t.preview.accent, border: `1px solid ${t.preview.border}` }}
                />
                <span
                  className="w-5 h-5 rounded-full"
                  style={{ background: t.preview.text, border: `1px solid ${t.preview.border}` }}
                />
                <span
                  className="w-5 h-5 rounded-full"
                  style={{ background: t.preview.bg, border: `1px solid ${t.preview.border}` }}
                />
                <span
                  className="w-5 h-5 rounded-full"
                  style={{ background: t.preview.border }}
                />
              </div>

              {/* Name */}
              <p className="text-[12px] font-semibold" style={{ color: t.preview.text }}>
                {t.name}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: t.preview.text, opacity: 0.55 }}>
                {t.description}
              </p>

              {/* Active check */}
              {isActive && (
                <span
                  className="absolute top-2 right-2 flex items-center justify-center"
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: t.preview.accent,
                    color: '#FFF',
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>check</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
