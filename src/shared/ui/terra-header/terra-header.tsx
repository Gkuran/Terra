import { Header, HeaderBrand } from "boulder-ui";
import { LuDownload, LuPlugZap, LuSettings2 } from "react-icons/lu";

import { AppButton } from "@/shared/ui/app-button/app-button";
import "./terra-header.css";

interface TerraHeaderProps {
  isExportDisabled?: boolean;
  isExporting?: boolean;
  onOpenConnectors: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
}

export function TerraHeader({
  isExportDisabled = false,
  isExporting = false,
  onOpenConnectors,
  onOpenExport,
  onOpenSettings,
}: TerraHeaderProps) {
  return (
    <Header className="terra-header" compact position="fixed" variant="glass">
      <HeaderBrand className="terra-header__brand">
        <div className="terra-header__brandcopy">
          <strong>Terra</strong>
        </div>
      </HeaderBrand>

      <div className="terra-header__actions">
        <AppButton
          aria-label="Export enriched occurrences"
          className="terra-header__action-button"
          disabled={isExportDisabled || isExporting}
          onClick={onOpenExport}
          title="Export"
          variant="secondary"
        >
          <LuDownload aria-hidden="true" />
        </AppButton>
        <AppButton
          aria-label="Open query settings"
          className="terra-header__action-button"
          onClick={onOpenSettings}
          title="Settings"
          variant="secondary"
        >
          <LuSettings2 aria-hidden="true" />
        </AppButton>
        <AppButton
          aria-label="Open data sources"
          className="terra-header__action-button"
          onClick={onOpenConnectors}
          title="Sources"
          variant="secondary"
        >
          <LuPlugZap aria-hidden="true" />
        </AppButton>
      </div>
    </Header>
  );
}
