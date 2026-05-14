import tls, { type DetailedPeerCertificate } from 'node:tls';
import {
  formatNetworkError,
  isValidHostname,
  normalizeHostname,
  parsePort,
  type CertificateLookupResponse,
} from '@/lib/workbench/network';

function formatCertificateEntity(entity: DetailedPeerCertificate['issuer'] | DetailedPeerCertificate['subject']) {
  if (!entity) {
    return 'Unknown';
  }

  return Object.entries(entity)
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(', ') : value}`)
    .join(', ');
}

async function inspectCertificate(hostname: string, port: number) {
  return new Promise<CertificateLookupResponse>((resolve, reject) => {
    const startedAt = Date.now();
    let settled = false;

    const finish = (handler: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      handler();
    };

    const socket = tls.connect({
      host: hostname,
      port,
      servername: hostname,
      rejectUnauthorized: false,
      timeout: 7000,
    });

    socket.once('secureConnect', () => {
      finish(() => {
        const certificate = socket.getPeerCertificate(true) as DetailedPeerCertificate;
        socket.end();

        if (!certificate.valid_to || !certificate.valid_from) {
          reject(new Error('No certificate returned by remote host'));
          return;
        }

        const validTo = new Date(certificate.valid_to);
        const validFrom = new Date(certificate.valid_from);
        const daysRemaining = Math.ceil((validTo.getTime() - Date.now()) / 86400000);

        resolve({
          hostname,
          port,
          issuer: formatCertificateEntity(certificate.issuer),
          subject: formatCertificateEntity(certificate.subject),
          validFrom: validFrom.toISOString(),
          validTo: validTo.toISOString(),
          daysRemaining,
          isExpired: daysRemaining < 0,
          fingerprint: certificate.fingerprint256 ?? certificate.fingerprint ?? 'Unknown',
          serialNumber: certificate.serialNumber ?? 'Unknown',
          subjectAltName: certificate.subjectaltname,
          durationMs: Date.now() - startedAt,
          fetchedAt: new Date().toISOString(),
        });
      });
    });

    socket.once('timeout', () => {
      finish(() => {
        socket.destroy();
        reject(new Error('Connection timed out'));
      });
    });

    socket.once('error', (error) => {
      finish(() => {
        socket.destroy();
        reject(error);
      });
    });
  });
}

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hostname = normalizeHostname(searchParams.get('hostname') ?? '');
  const port = parsePort(searchParams.get('port'));

  if (!isValidHostname(hostname)) {
    return Response.json({ error: 'Invalid hostname' }, { status: 400 });
  }

  if (!port) {
    return Response.json({ error: 'Invalid port' }, { status: 400 });
  }

  try {
    const payload = await inspectCertificate(hostname, port);
    return Response.json(payload, { status: 200 });
  } catch (error) {
    return Response.json({ error: formatNetworkError(error) }, { status: 400 });
  }
}