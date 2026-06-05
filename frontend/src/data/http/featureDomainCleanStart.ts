import { resetFeatureLocalStorageForBackendCleanStart } from "@/data/localStorage/cleanStartCutover";

let hasAppliedFeatureCleanStart = false;

export const ensureFeatureBackendCleanStartCutover = (): void => {
  if (hasAppliedFeatureCleanStart) {
    return;
  }

  resetFeatureLocalStorageForBackendCleanStart();
  hasAppliedFeatureCleanStart = true;
};
