import { resetCoreLocalStorageForBackendCleanStart } from "@/data/localStorage/cleanStartCutover";

let hasAppliedCleanStart = false;

export const ensureCoreBackendCleanStartCutover = (): void => {
  if (hasAppliedCleanStart) {
    return;
  }

  resetCoreLocalStorageForBackendCleanStart();
  hasAppliedCleanStart = true;
};
