// SPDX-License-Identifier: MPL-2.0
const html = Bun.file(new URL('../src/prototype/index.html', import.meta.url));
const server = Bun.serve({
  hostname: '127.0.0.1', port: Number(process.env.PORT || 8080),
  fetch(request) {
    const path = new URL(request.url).pathname;
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    if (path !== '/' && path !== '/index.html') return new Response('Not found', { status: 404 });
    return new Response(request.method === 'HEAD' ? null : html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  }
});
console.log(`Bowtie Workbench: ${server.url}`);
