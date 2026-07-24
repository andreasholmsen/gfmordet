import { Component, type ErrorInfo, type ReactNode } from 'react'

// Fanger uventede render-feil hvor som helst i appen og viser en vennlig skjerm
// i stedet for en blank hvit side. Error boundaries MÅ være klassekomponenter.
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Logg til konsollen så det kan feilsøkes (synlig i nettleserens dev tools).
    console.error('App-krasj fanget av ErrorBoundary:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="errbound">
          <div className="errbound__card">
            <h1 className="errbound__title">💥 Beklager — noe gikk galt</h1>
            <p>
              Det oppstod en uventet feil. Last siden på nytt for å fortsette — fremgangen din er
              lagret.
            </p>
            <button className="btn btn--primary" onClick={() => window.location.reload()}>
              Last siden på nytt
            </button>
            {import.meta.env.DEV && (
              <pre className="errbound__detail">
                {String(this.state.error.stack ?? this.state.error)}
              </pre>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
