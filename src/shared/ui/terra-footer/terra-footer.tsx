import { Card, CardContent } from 'boulder-ui'

import './terra-footer.css'

interface TerraFooterProps {
  credit: string
  hoverTarget: string
}

export function TerraFooter({ credit, hoverTarget }: TerraFooterProps) {
  return (
    <footer className="terra-footer">
      <Card className="terra-footer__card" variant="glass">
        <CardContent className="terra-footer__content">
          <div className="terra-footer__section">
            <span className="terra-footer__label">Hover target</span>
            <strong className="terra-footer__value">{hoverTarget}</strong>
          </div>

          <div className="terra-footer__section terra-footer__section--credit">
            <span className="terra-footer__credit">{credit}</span>
          </div>
        </CardContent>
      </Card>
    </footer>
  )
}
