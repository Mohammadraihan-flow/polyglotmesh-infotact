import React from 'react'

function LanguageTabs({ activeLanguage, languages, onSelectLanguage }) {
  return (
    <section className="language-tabs" aria-label="Language selector">
      <div>
        <p className="language-tabs__eyebrow">Active language</p>
        <h2 className="language-tabs__title">{activeLanguage}</h2>
      </div>

      <div className="language-tabs__list" role="tablist" aria-label="Editor language tabs">
        {languages.map((language) => {
          const isActive = language === activeLanguage

          return (
            <button
              key={language}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`language-tabs__tab${isActive ? ' language-tabs__tab--active' : ''}`}
              onClick={() => onSelectLanguage(language)}
            >
              {language}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default React.memo(LanguageTabs)