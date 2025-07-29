const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.HTTPS_PORT || 50445;

// Next.js 앱 생성
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// SSL 인증서 경로 (Docker 환경에서는 /app/certs, 로컬에서는 ../certs)
const certPath = fs.existsSync('/app/certs') ? '/app/certs' : path.join(__dirname, '../certs');
const httpsOptions = {
  key: fs.readFileSync(path.join(certPath, 'admin-app.key')),
  cert: fs.readFileSync(path.join(certPath, 'admin-app.crt'))
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on https://${hostname}:${port}`);
    });
});