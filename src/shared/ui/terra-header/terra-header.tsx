import { Header, HeaderBrand, HeaderNav } from "boulder-ui";

import type { DatasetMetadata } from "@/entities/dataset/model/dataset";
import "./terra-header.css";

interface TerraHeaderProps {
  activeDataset: DatasetMetadata;
}

export function TerraHeader({ activeDataset }: TerraHeaderProps) {
  return (
    <Header className="terra-header" compact position="fixed" variant="glass">
      <HeaderBrand className="terra-header__brand">
        <div className="terra-header__brandcopy">
          <strong>Terra</strong>
        </div>
      </HeaderBrand>

      <HeaderNav aria-label="Dataset context" className="terra-header__nav">
        <div className="terra-header__context">
          <strong>{activeDataset.name}</strong>
          <span>{activeDataset.regionLabel}</span>
        </div>
      </HeaderNav>
    </Header>
  );
}
