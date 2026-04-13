import { Card, CardContent } from "boulder-ui";
import { LuGithub, LuLinkedin, LuMountain } from "react-icons/lu";

import "./terra-footer.css";

interface TerraFooterProps {
  credit: string;
  githubUrl: string;
  hoverTarget: string;
  isClimbingModeEnabled: boolean;
  linkedinUrl: string;
  onToggleClimbingMode: () => void;
  showClimbingModeButton?: boolean;
}

export function TerraFooter({
  credit,
  githubUrl,
  hoverTarget,
  isClimbingModeEnabled,
  linkedinUrl,
  onToggleClimbingMode,
  showClimbingModeButton = true,
}: TerraFooterProps) {
  return (
    <footer className="terra-footer">
      <Card className="terra-footer__card" variant="glass">
        <CardContent className="terra-footer__content">
          <div className="terra-footer__section">
            <span className="terra-footer__label terra-footer__mobile-hidden">Hover target</span>
            <strong className="terra-footer__value">{hoverTarget}</strong>
          </div>

          <div className="terra-footer__section terra-footer__section--credit">
            <span className="terra-footer__credit terra-footer__mobile-hidden">{credit}</span>
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
              {showClimbingModeButton ? (
                <button
                  aria-label="Toggle climbing mode"
                  className={`terra-footer__link terra-footer__link--action${isClimbingModeEnabled ? " terra-footer__link--active" : ""}`}
                  onClick={onToggleClimbingMode}
                  title={isClimbingModeEnabled ? "Disable OSM climbing mode" : "Enable OSM climbing mode"}
                  type="button"
                >
                  <LuMountain aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </footer>
  );
}
