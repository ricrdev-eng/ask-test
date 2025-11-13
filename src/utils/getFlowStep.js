import { steps } from "../flow/bookingFlow.js";

export function getStep(stepName) {
  return steps.find(s => s.step === stepName);
}
