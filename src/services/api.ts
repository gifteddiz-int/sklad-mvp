import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://store.suringa.shop',
  timeout: 15000,
});

function buildLabel(code: string): string {
  return `^XA^PW472^LL472^CI28^PR3,3,3^MD12^FO60,40^A0N,50,50^FDShop^FS^FO90,260^BY2,2,70^B3N,N,70,Y,N^FD${code}^FS^XZ`;
}

export async function setPrintLabel(
  code: string,
  opts?: { qty?: number; token?: string }
): Promise<void> {
  const qty = opts?.qty ?? 1;
  const token = opts?.token ?? 'raspberrypi';

  const params = new URLSearchParams();
  params.set('token', token);
  params.set('qty', String(qty));
  params.set('label', buildLabel(code));

  await apiClient.post('/printer/setPrintLabel/', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

export const api = {
  setPrintLabel,
};

