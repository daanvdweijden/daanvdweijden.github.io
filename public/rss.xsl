<?xml version="1.0" encoding="UTF-8"?>
<!--
  Makes /notes/rss.xml readable when someone opens it in a browser. Feed
  readers ignore this file. Colours copied from the tokens in
  src/layouts/Layout.astro; keep them in sync if those change.
-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat" />
  <xsl:template match="/rss/channel">
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title><xsl:value-of select="title" /> (RSS)</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <style>
          :root {
            --bg: #efeee9; --ink: #161616; --muted: #6e6d68;             --accent: #a3472b;
            --font: 'Archivo Variable', 'Helvetica Neue', Arial, sans-serif;
            color-scheme: light dark;
          }
          @media (prefers-color-scheme: dark) {
            :root { --bg: #141413; --ink: #ecebe6; --muted: #8f8e88; --accent: #e38d6f; }
          }
          body {
            margin: 0; background: var(--bg); color: var(--ink);
            font: 400 1rem/1.55 var(--font);
          }
          main { max-width: 36rem; margin: 0 auto; padding: 4rem 16px; }
          a { color: inherit; text-underline-offset: .2em; }
          h1 { font-size: 1.4rem; font-weight: 500; margin: 0 0 .8rem; }
          p { margin: 0 0 1rem; color: var(--muted); }
          code { font: inherit; color: var(--ink); overflow-wrap: anywhere; }
          button { font: inherit; color: var(--accent); background: none; border: 0; padding: 0; cursor: pointer; text-decoration: underline; text-underline-offset: .2em; }
          ol { list-style: none; padding: 0; margin: 2.5rem 0; }
          li { margin-bottom: 1.2rem; }
          .dek { display: block; color: var(--muted); }
        </style>
      </head>
      <body>
        <main>
          <h1><xsl:value-of select="title" /></h1>
          <p>This is an RSS feed. Paste the link into a feed reader to get new notes as they come out.</p>
          <p><code id="feed-url">https://daanvdweijden.com/notes/rss.xml</code> · <button type="button" id="copy-btn">copy</button></p>
          <ol>
            <xsl:for-each select="item">
              <li>
                <a href="{link}"><xsl:value-of select="title" /></a>
                <xsl:if test="description">
                  <span class="dek"><xsl:value-of select="description" /></span>
                </xsl:if>
              </li>
            </xsl:for-each>
          </ol>
          <p><a href="/notes/">All notes</a></p>
        </main>
        <script>
          (function () {
            var url = location.href.split('#')[0];
            var code = document.getElementById('feed-url');
            var btn = document.getElementById('copy-btn');
            code.textContent = url;
            btn.addEventListener('click', function () {
              navigator.clipboard.writeText(url).then(function () {
                btn.textContent = 'copied';
                setTimeout(function () { btn.textContent = 'copy'; }, 1600);
              });
            });
          })();
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
