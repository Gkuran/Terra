import { Card, CardContent } from "boulder-ui";
import { LuGithub, LuLinkedin } from "react-icons/lu";

import "./terra-footer.css";

interface TerraFooterProps {
  credit: string;
  githubUrl: string;
  hoverTarget: string;
  linkedinUrl: string;
}

export function TerraFooter({
  credit,
  githubUrl,
  hoverTarget,
  linkedinUrl,
}: TerraFooterProps) {
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
            <div className="terra-footer__links" aria-label="Developer links">
              <a
                aria-label="Open GitHub profile"
                className="terra-footer__link"
                href={githubUrl}
                rel="noreferrer"
                target="_blank"
              >
                <LuGithub aria-hidden="true" />
              </a>
              <a
                aria-label="Open LinkedIn profile"
                className="terra-footer__link"
                href={linkedinUrl}
                rel="noreferrer"
                target="_blank"
              >
                <LuLinkedin aria-hidden="true" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </footer>
  );
}
