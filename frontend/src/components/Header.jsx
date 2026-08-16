import './Header.css'

export default function Header({ page, onNavigate }) {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10" stroke="var(--violet)" strokeWidth="1.4" opacity="0.5" />
              <circle cx="11" cy="11" r="6.4" stroke="var(--cyan)" strokeWidth="1.4" opacity="0.7" />
              <circle cx="11" cy="11" r="3" fill="var(--violet)" />
            </svg>
          </span>
          <div className="brand__text">
            <span className="brand__name">ConsultBae</span>
            <span className="brand__sub">Audio Collection</span>
          </div>
        </div>

        <nav className="site-nav" aria-label="Primary">
          <button
            type="button"
            className={`site-nav__link ${page === 'record' ? 'is-active' : ''}`}
            onClick={() => onNavigate('record')}
            aria-current={page === 'record' ? 'page' : undefined}
          >
            Record Audio
          </button>
          <button
            type="button"
            className={`site-nav__link ${page === 'submissions' ? 'is-active' : ''}`}
            onClick={() => onNavigate('submissions')}
            aria-current={page === 'submissions' ? 'page' : undefined}
          >
            Submissions
          </button>
        </nav>
      </div>
    </header>
  )
}
