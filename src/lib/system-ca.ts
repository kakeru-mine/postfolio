import { getCACertificates, setDefaultCACertificates } from "node:tls";
import { Agent, setGlobalDispatcher } from "undici";

const globalForCa = globalThis as typeof globalThis & {
  postfolioSystemCaConfigured?: boolean;
};

export function ensureSystemCa() {
  if (globalForCa.postfolioSystemCaConfigured) return;

  const certificates = [
    ...getCACertificates("default"),
    ...getCACertificates("system"),
  ];
  const trustedCertificates = [...new Set(certificates)];
  setDefaultCACertificates(trustedCertificates);
  setGlobalDispatcher(
    new Agent({
      connect: { ca: trustedCertificates },
    }),
  );
  globalForCa.postfolioSystemCaConfigured = true;
}
